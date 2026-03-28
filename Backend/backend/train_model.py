import pandas as pd
import glob
import pickle
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import LabelEncoder

# check files
files = glob.glob("data/*.csv")
print(f"Found {len(files)} files: {files}")

if len(files) == 0:
    print("ERROR: no CSV files found in data/ folder. make sure your files are in backend/data/")
    exit()

# load all files
dfs = []
for f in files:
    try:
        df = pd.read_csv(f)
        print(f"loaded {f} — {len(df)} rows, columns: {list(df.columns)}")
        dfs.append(df)
    except Exception as e:
        print(f"failed to load {f}: {e}")

if len(dfs) == 0:
    print("ERROR: no files loaded successfully")
    exit()

df = pd.concat(dfs, ignore_index=True)
print(f"Total rows: {len(df)}")
print(f"Columns: {list(df.columns)}")
print(df.head())

# rename columns
df.columns = ['date', 'hour', 'airport_code', 'airport_name', 'city', 'state', 'checkpoint', 'total_pax']

# clean
df = df.dropna()
df['date'] = pd.to_datetime(df['date'], errors='coerce')
df = df.dropna(subset=['date'])
df['day_of_week'] = df['date'].dt.dayofweek
df['month'] = df['date'].dt.month
df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
df['total_pax'] = df['total_pax'].astype(str).str.replace(',', '').str.strip()
df['total_pax'] = pd.to_numeric(df['total_pax'], errors='coerce')
df = df.dropna(subset=['total_pax'])
df['hour'] = df['hour'].astype(str).str.extract(r'(\d+)').astype(int)

print(f"Rows after cleaning: {len(df)}")

# encode airport
le = LabelEncoder()
df['airport_encoded'] = le.fit_transform(df['airport_code'])
with open("airport_encoder.pkl", "wb") as f:
    pickle.dump(le, f)

# train
X = df[['hour', 'day_of_week', 'month', 'is_weekend', 'airport_encoded']]
y = df['total_pax']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = XGBRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)
print(f"MAE: {mae:.2f} passengers")

with open("tsa_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("model saved successfully.")