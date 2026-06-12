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


def fConvertValue(value):
    if pd.isna(value):
        return ""

    if isinstance(value, str):
        sValue = value.strip()

        if sValue.lower() == "true":
            return True

        if sValue.lower() == "false":
            return False

        return sValue

    return value


def fImportCollection(sCollectionName, sCsvFileName, sIdColumn):
    sCsvPath = os.path.join(DATA_DIR, sCsvFileName)

    df = pd.read_csv(sCsvPath, encoding="utf-8-sig", sep=";")

    for _, row in df.iterrows():
        # add zero padding to the document id if needed
        if isinstance(row[sIdColumn], int):
            sDocumentId = str(row[sIdColumn]).strip().zfill(5)
        else:
            sDocumentId = str(row[sIdColumn]).strip()

        dctData = {}

        for sColumn in df.columns:
            if sColumn == sIdColumn:
                continue

            dctData[sColumn] = fConvertValue(row[sColumn])
            
        if sCollectionName == "employees":
            dctData["description"] = f"{dctData.get('surname', '')} {dctData.get('givenname', '')}".strip()

        db.collection(sCollectionName).document(sDocumentId).set(dctData)

        print(f"Imported {sCollectionName}/{sDocumentId}")


cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)

db = firestore.client()



fImportCollection("companys","companys.csv","code")

fImportCollection("departments","departments.csv","code")

fImportCollection("spots","spots.csv","code")

fImportCollection("positions","positions.csv","code")

fImportCollection("roles","roles.csv","code")

fImportCollection("employees","employees.csv","code")

print("Done.")