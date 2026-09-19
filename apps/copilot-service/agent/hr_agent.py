import json
import re
import asyncio
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional, AsyncGenerator

# Ensure microservice root is on python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from security.scrubber import scrub_text
from security.guardrails import check_domain_guardrail
from agent.escalation import check_sensitive_escalation, create_hr_escalation_ticket
from agent.tools import (
    fetch_employee_stats,
    fetch_employee_profile,
    fetch_employee_salary,
    fetch_employee_attendance,
    fetch_employee_leave,
    fetch_employee_performance,
    fetch_payroll_run_details,
    query_company_policies,
    format_currency_hrms,
)
from agent.router import extract_query_entities, route_query_request
from rag.ingestion import get_category_display_label
from llm_provider import get_llm_provider, NOT_AVAILABLE_FALLBACK

class HRAgent:
    """
    Intelligent HR Agent with Revision 2 capabilities:
    - Defense-in-depth Multi-tenant validation & Tool-level RBAC
    - Environment-configured Domain Guardrails (preceding LLM)
    - Pre-retrieval Key-phrase & Entity Extraction deterministic routing
    - Full Employee Record Tools (profile, salary, attendance, leave, performance)
    - Salary-field access audit logging
    - Sensitive escalation auto-drafting
    - Grounded RAG with source metadata citations
    - SSE token streaming
    """
    def __init__(self):
        self.llm = get_llm_provider()

    def process_query(
        self,
        company_id: str,
        user_id: Optional[str],
        role: str,
        message: str,
        session_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        employee_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Synchronous / full pipeline execution.
        """
        # 1. PII and Biometric Data Scrubbing (Constraint 5)
        cleaned_query = scrub_text(message)

        # 2. Sensitive Topic & Escalation Pre-check (Constraint 8)
        sensitive = check_sensitive_escalation(cleaned_query)
        if sensitive:
            cat, priority, reason = sensitive
            ticket = create_hr_escalation_ticket(
                company_id=company_id,
                user_id=user_id,
                query=cleaned_query,
                category=cat,
                priority=priority,
                reason=reason,
            )
            return {
                "answer": (
                    "This matter involves sensitive workplace topics. "
                    "I have automatically created a confidential draft ticket for your HR department "
                    f"under category '{cat}'. An HR representative will follow up."
                ),
                "citations": [],
                "escalation": ticket,
                "grounded": True,
                "status": "ESCALATED_TO_HR",
            }

        # 3. Environment-Configured Domain Guardrail (Constraint 10)
        in_domain, rejection_msg = check_domain_guardrail(cleaned_query)
        if not in_domain:
            return {
                "answer": rejection_msg,
                "citations": [],
                "escalation": None,
                "grounded": False,
                "status": "GUARDRAIL_REJECTED",
            }

        # 4. Pre-retrieval Key-phrase/Entity Extraction & Deterministic Routing (Constraint 11)
        entities = extract_query_entities(cleaned_query, requester_user_id=user_id)
        routing = route_query_request(entities)
        target_id = entities.target_user_id or user_id

        # 5. Direct Database Lookup Routing (Revision 2 Constraint 9 & 11)
        if routing.route_type == "DIRECT_DB_LOOKUP":
            tool_name = routing.tool_name

            if tool_name == "fetch_employee_salary":
                res = fetch_employee_salary(
                    company_id=company_id,
                    target_user_id=target_id,
                    requester_role=role,
                    requester_user_id=user_id,
                    employee_override=employee_data,
                )
                if res.get("status") == "FORBIDDEN":
                    return {
                        "answer": "Access Denied: Employees are only authorized to query their own compensation records.",
                        "citations": [],
                        "escalation": None,
                        "grounded": True,
                        "status": "RBAC_BLOCKED",
                    }
                if res.get("status") == "NOT_FOUND":
                    return {
                        "answer": res.get("message"),
                        "citations": [],
                        "escalation": None,
                        "grounded": False,
                        "status": "NOT_FOUND",
                    }

                formatted_sal = res.get("formatted_salary") or format_currency_hrms(res.get("monthly_salary", 0), res.get("currency", "INR"))
                emp_id = res.get("employee_id") or res.get("user_id") or "Not assigned"
                dept = res.get("department") or "Not specified"
                role_str = res.get("role") or "Not specified"
                email_str = res.get("email") or "Not available"
                phone_str = res.get("phone") or "Not available"
                status_str = res.get("status_label") or "Active"
                name_str = res.get("name") or "Employee"

                ans = (
                    f"Salary & Compensation Details:\n"
                    f"Your monthly salary is **{formatted_sal}**.\n\n"
                    f"*(Would you like to view your full employee details? Ask \"show my profile\" or click Additional Details below)*"
                )
                return {
                    "answer": ans,
                    "citations": [{
                        "document": "Vektra Core HR Database",
                        "source_doc": "Vektra Core HR Database",
                        "page": 1,
                        "page_number": 1,
                        "section": "Compensation Records",
                    }],
                    "escalation": None,
                    "grounded": True,
                    "status": "COMPLETED",
                }

            elif tool_name == "fetch_employee_attendance":
                res = fetch_employee_attendance(
                    company_id=company_id,
                    target_user_id=target_id,
                    requester_role=role,
                    requester_user_id=user_id,
                    date_range=entities.date_range,
                    employee_override=employee_data,
                )
                if res.get("status") == "FORBIDDEN":
                    return {
                        "answer": "Access Denied: Employees are only authorized to query their own employee records.",
                        "citations": [],
                        "escalation": None,
                        "grounded": True,
                        "status": "RBAC_BLOCKED",
                    }
                if res.get("status") == "NOT_FOUND":
                    return {
                        "answer": res.get("message"),
                        "citations": [],
                        "escalation": None,
                        "grounded": False,
                        "status": "NOT_FOUND",
                    }

                summ = res.get("summary", {})
                ans = (
                    f"Attendance Record for {res.get('name')} ({res.get('user_id')}):\n"
                    f"• Overall Attendance: {res.get('attendance_percentage', 0)}%\n"
                    f"• Total Working Days: {summ.get('total_working_days', 0)}\n"
                    f"• Present Days: {summ.get('present_days', 0)} | Absent Days: {summ.get('absent_days', 0)}\n"
                    f"• Late Arrivals: {summ.get('late_days', 0)}"
                )
                return {
                    "answer": ans,
                    "citations": [{
                        "document": "Vektra Core HR Database",
                        "source_doc": "Vektra Core HR Database",
                        "page": 1,
                        "page_number": 1,
                        "section": "Attendance Records",
                    }],
                    "escalation": None,
                    "grounded": True,
                    "status": "COMPLETED",
                }

            elif tool_name == "fetch_employee_leave":
                res = fetch_employee_leave(
                    company_id=company_id,
                    target_user_id=target_id,
                    requester_role=role,
                    requester_user_id=user_id,
                    employee_override=employee_data,
                )
                if res.get("status") == "FORBIDDEN":
                    return {
                        "answer": "Access Denied: Employees are only authorized to query their own employee records.",
                        "citations": [],
                        "escalation": None,
                        "grounded": True,
                        "status": "RBAC_BLOCKED",
                    }
                if res.get("status") == "NOT_FOUND":
                    return {
                        "answer": res.get("message"),
                        "citations": [],
                        "escalation": None,
                        "grounded": False,
                        "status": "NOT_FOUND",
                    }

                bal = res.get("leave_balance", {})
                ans = (
                    f"Leave Entitlement & Balances for {res.get('name')} ({res.get('user_id')}):\n"
                    f"• Casual Leave: {bal.get('casual', 0)} days remaining\n"
                    f"• Sick Leave: {bal.get('sick', 0)} days remaining\n"
                    f"• Annual Vacation: {bal.get('annual', 0)} days remaining\n"
                    f"• Unpaid Leave Taken: {bal.get('unpaid', 0)} days"
                )
                return {
                    "answer": ans,
                    "citations": [{
                        "document": "Vektra Core HR Database",
                        "source_doc": "Vektra Core HR Database",
                        "page": 1,
                        "page_number": 1,
                        "section": "Leave Management",
                    }],
                    "escalation": None,
                    "grounded": True,
                    "status": "COMPLETED",
                }

            elif tool_name == "fetch_employee_profile":
                res = fetch_employee_profile(
                    company_id=company_id,
                    target_user_id=target_id,
                    requester_role=role,
                    requester_user_id=user_id,
                    employee_override=employee_data,
                )
                if res.get("status") == "FORBIDDEN":
                    return {
                        "answer": "Access Denied: Employees are only authorized to query their own employee records.",
                        "citations": [],
                        "escalation": None,
                        "grounded": True,
                        "status": "RBAC_BLOCKED",
                    }
                if res.get("status") == "NOT_FOUND":
                    return {
                        "answer": res.get("message"),
                        "citations": [],
                        "escalation": None,
                        "grounded": False,
                        "status": "NOT_FOUND",
                    }

                formatted_sal = res.get("formatted_salary") or format_currency_hrms(res.get("monthly_salary", 0), res.get("currency", "INR"))
                emp_id = res.get("employee_id") or res.get("user_id") or "Not assigned"
                dept = res.get("department") or "Not specified"
                role_str = res.get("role") or "Not specified"
                email_str = res.get("email") or "Not available"
                phone_str = res.get("phone") or "Not available"
                status_str = res.get("status_label") or "Active"
                name_str = res.get("name") or "Employee"

                q = cleaned_query.lower()
                suffix_option = f"\n\n*(Would you like to view your full employee details? Ask \"show my profile\" or click Additional Details below)*"

                # Check for specific questions
                is_name_q = any(k in q for k in ["my name", "whats my name", "what's my name", "what is my name", "who am i", "tell me my name", "show my name"])
                is_id_q = any(k in q for k in ["employee id", "emp id", "my id", "whats my id", "what is my id", "show my id", "id number"])
                is_dept_q = any(k in q for k in ["department", "which dept", "my dept", "which team"])
                is_role_q = any(k in q for k in ["my role", "my designation", "job title", "my title", "my position", "what do i do", "what is my role", "whats my role"])
                is_email_q = any(k in q for k in ["my email", "official email", "work email", "email address", "what is my email", "whats my email"])
                is_phone_q = any(k in q for k in ["phone", "mobile", "contact number", "cell", "telephone"])
                is_status_q = any(k in q for k in ["my status", "employment status", "am i active", "work status", "status"])
                is_join_q = any(k in q for k in ["joining date", "date of joining", "when did i join", "hired date", "hire date"])

                is_full_profile_q = any(k in q for k in [
                    "profile", "all details", "full details", "additional details",
                    "employee details", "show everything", "about me", "my info", "full info",
                    "my record", "complete details", "more details"
                ])

                if is_id_q and not is_full_profile_q:
                    ans = f"Your Employee ID is **{emp_id}**.{suffix_option}"
                elif is_name_q and not is_full_profile_q:
                    ans = f"Your name is **{name_str}**.{suffix_option}"
                elif is_dept_q and not is_full_profile_q:
                    ans = f"Your department is **{dept}**.{suffix_option}"
                elif is_role_q and not is_full_profile_q:
                    ans = f"Your designation / role is **{role_str}**.{suffix_option}"
                elif is_email_q and not is_full_profile_q:
                    ans = f"Your official email is **{email_str}**.{suffix_option}"
                elif is_phone_q and not is_full_profile_q:
                    ans = f"Your registered contact phone is **{phone_str}**.{suffix_option}"
                elif is_status_q and not is_full_profile_q:
                    ans = f"Your employment status is **{status_str}**.{suffix_option}"
                elif is_join_q and not is_full_profile_q:
                    ans = f"Your date of joining is **{res.get('date_of_joining', 'N/A')}**.{suffix_option}"
                else:
                    ans = (
                        f"**Employee Section Details** for **{name_str}**:\n\n"
                        f"• EMPLOYEE NAME: {name_str}\n"
                        f"• EMPLOYEE ID: {emp_id}\n"
                        f"• DEPARTMENT: {dept}\n"
                        f"• ROLE: {role_str}\n"
                        f"• EMAIL: {email_str}\n"
                        f"• PHONE NUMBER: {phone_str}\n"
                        f"• SALARY DETAILS: {formatted_sal}\n"
                        f"• STATUS: {status_str}"
                    )


                return {
                    "answer": ans,
                    "citations": [{
                        "document": "Vektra Core HR Database",
                        "source_doc": "Vektra Core HR Database",
                        "page": 1,
                        "page_number": 1,
                        "section": "Employee Directory",
                    }],
                    "escalation": None,
                    "grounded": True,
                    "status": "COMPLETED",
                }

            elif tool_name == "fetch_employee_performance":
                res = fetch_employee_performance(
                    company_id=company_id,
                    target_user_id=target_id,
                    requester_role=role,
                    requester_user_id=user_id,
                    employee_override=employee_data,
                )
                if res.get("status") == "FORBIDDEN":
                    return {
                        "answer": "Access Denied: Employees are only authorized to query their own employee records.",
                        "citations": [],
                        "escalation": None,
                        "grounded": True,
                        "status": "RBAC_BLOCKED",
                    }
                if res.get("status") == "NOT_FOUND":
                    return {
                        "answer": res.get("message"),
                        "citations": [],
                        "escalation": None,
                        "grounded": False,
                        "status": "NOT_FOUND",
                    }

                kpi_str = ", ".join([f"{k}: {v}" for k, v in res.get("kpis", {}).items()])
                ans = (
                    f"Performance Evaluation for {res.get('name')} ({res.get('user_id')}):\n"
                    f"• Appraisal Rating: {res.get('rating')} / {res.get('scale', 5.0)}\n"
                    f"• Review Period: {res.get('review_period')}\n"
                    f"• Goals Completed: {res.get('goals_completed')}/{res.get('total_goals')}\n"
                    f"• Key KPI Metrics: {kpi_str}\n"
                    f"• Manager Remarks: \"{res.get('manager_feedback')}\""
                )
                return {
                    "answer": ans,
                    "citations": [{
                        "document": "Vektra Core HR Database",
                        "source_doc": "Vektra Core HR Database",
                        "page": 1,
                        "page_number": 1,
                        "section": "Performance Management",
                    }],
                    "escalation": None,
                    "grounded": True,
                    "status": "COMPLETED",
                }

            elif tool_name == "fetch_payroll_run_details":
                match_run = re.search(r"\b(run_[a-zA-Z0-9_]+)\b", cleaned_query)
                run_id = match_run.group(1) if match_run else "run_2026_08"

                payroll_res = fetch_payroll_run_details(
                    company_id=company_id,
                    run_id=run_id,
                    requester_role=role,
                    requester_user_id=user_id,
                )

                if payroll_res.get("status") == "FORBIDDEN":
                    return {
                        "answer": "Access Denied: Aggregate payroll metrics require HR or Admin privileges.",
                        "citations": [],
                        "escalation": None,
                        "grounded": True,
                        "status": "RBAC_BLOCKED",
                    }

                if payroll_res.get("status") == "NOT_FOUND":
                    return {
                        "answer": payroll_res.get("message"),
                        "citations": [],
                        "escalation": None,
                        "grounded": False,
                        "status": "NOT_FOUND",
                    }

                ans = (
                    f"Payroll Run {payroll_res.get('run_id')} Details:\n"
                    f"• Period: {payroll_res.get('month')}/{payroll_res.get('year')}\n"
                    f"• Total Disbursed: ${payroll_res.get('total_disbursed'):,.2f}\n"
                    f"• Employees Processed: {payroll_res.get('employee_count')}\n"
                    f"• Status: {payroll_res.get('status_label')} (Approved by {payroll_res.get('approved_by')})"
                )
                return {
                    "answer": ans,
                    "citations": [{
                        "document": "Vektra Payroll Ledger",
                        "source_doc": "Vektra Payroll Ledger",
                        "page": 1,
                        "page_number": 1,
                        "section": "Payroll Runs",
                    }],
                    "escalation": None,
                    "grounded": True,
                    "status": "COMPLETED",
                }

        # 6. Controlled Policy RAG Retrieval (with optional Category Filter)
        cat_filter = getattr(routing, "category_filter", None) or getattr(entities, "target_doc_category", None)
        chunks = query_company_policies(company_id=company_id, query=cleaned_query, category=cat_filter)

        if not chunks:
            # Unresolved query produces auto-draft escalation (Constraint 8)
            ticket = create_hr_escalation_ticket(
                company_id=company_id,
                user_id=user_id,
                query=cleaned_query,
                category="Unresolved Policy Query",
                priority="MEDIUM",
                reason="Requested information is missing from official company documents",
            )
            return {
                "answer": NOT_AVAILABLE_FALLBACK,
                "citations": [],
                "escalation": ticket,
                "grounded": False,
                "status": "NOT_AVAILABLE_IN_RECORDS",
            }

        # LLM Synthesis with Grounding Citations (Phase 6 Requirement 7)
        citations = [
            {
                "document": c.get("source_doc"),
                "source_doc": c.get("source_doc"),
                "category": c.get("category"),
                "category_label": get_category_display_label(c.get("category")),
                "page": c.get("page_number", 1),
                "page_number": c.get("page_number", 1),
                "section": c.get("section", "General"),
                "citation_text": f"[{get_category_display_label(c.get('category'))} — {c.get('source_doc')}, Page {c.get('page_number', 1)}]",
            }
            for c in chunks
        ]

        top_chunk = chunks[0]
        top_cat_label = get_category_display_label(top_chunk.get("category"))
        top_doc_name = top_chunk.get("source_doc", "Company Document")
        top_page = top_chunk.get("page_number", 1)
        grounded_answer = (
            f"According to [{top_cat_label} — {top_doc_name}, Page {top_page}] "
            f"(Section: '{top_chunk.get('section', 'General')}'):\n\n{top_chunk.get('content')}"
        )

        return {
            "answer": grounded_answer,
            "citations": citations,
            "escalation": None,
            "grounded": True,
            "status": "COMPLETED",
        }

    async def stream_query(
        self,
        company_id: str,
        user_id: Optional[str],
        role: str,
        message: str,
        session_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        employee_data: Optional[Dict[str, Any]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Generates SSE-formatted stream events.
        """
        result = self.process_query(
            company_id=company_id,
            user_id=user_id,
            role=role,
            message=message,
            session_id=session_id,
            history=history,
            employee_data=employee_data,
        )

        answer = result.get("answer", "")
        citations = result.get("citations", [])
        escalation = result.get("escalation")
        status_label = result.get("status", "COMPLETED")

        # Stream answer token by token
        words = answer.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            payload = json.dumps({"token": chunk, "status": status_label})
            yield f"data: {payload}\n\n"
            await asyncio.sleep(0.01)

        # Stream metadata / citations / escalation event
        meta_payload = json.dumps({
            "citations": citations,
            "escalation": escalation,
            "grounded": result.get("grounded", False),
            "status": status_label,
            "done": True,
        })
        yield f"data: {meta_payload}\n\n"
