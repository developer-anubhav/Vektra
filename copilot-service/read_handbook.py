# pyrefly: ignore [missing-import]
import chromadb

client = chromadb.PersistentClient(path="./data/chroma")
coll = client.get_collection("vektra_policies")
results = coll.get()

for i, m in enumerate(results["metadatas"]):
    if m.get("source_doc") == "Vektra_Sample_Employee_Handbook_TEST.pdf":
        page = m.get("page_number")
        sec = m.get("section")
        content = results["documents"][i]
        print(f"=== PAGE {page} | SECTION: {sec} ===")
        print(content[:300])
        print("...")
