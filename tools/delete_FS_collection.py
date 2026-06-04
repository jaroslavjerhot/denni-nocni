import os
import pandas as pd
import firebase_admin

from firebase_admin import credentials
from firebase_admin import firestore


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SERVICE_ACCOUNT_PATH = os.path.join(
    BASE_DIR,
    "serviceAccountKey.json"
)

DATA_DIR = os.path.join(
    BASE_DIR,
    "data"
)

def fDeleteCollection(sCollectionName):

    docs = db.collection(sCollectionName).stream()
    
    if not docs:
        print(f"No documents found in {sCollectionName}")
        return

    iCount = 0

    for doc in docs:
        doc.reference.delete()
        iCount += 1

    print(f"Deleted {iCount} documents from {sCollectionName}")



cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)

db = firestore.client()

for sCollection in [
    "employees",
    "registeredUsers",
    "positions",
    "departments",
    "roles",
    "rooms"
]:
    fDeleteCollection(sCollection)