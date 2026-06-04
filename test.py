import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import statsmodels.api as sm
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings

warnings.filterwarnings('ignore')
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['figure.figsize'] = (12, 6)


# ## 1. Load data

# In[2]:


master_csv = "national_harm_weighted_master.csv"
df_raw = pd.read_csv(master_csv, low_memory=False)
df_raw['Month'] = pd.to_datetime(df_raw['Month'])

# Aggregate nationally: sum Harm Units, average the deprivation rank
df = df_raw.groupby('Month').agg(
    Total_Harm_Units=('Total_Harm_Units', 'sum'),
    Average_IMD_Rank=('IMD_Rank', 'mean')
).reset_index()
df.set_index('Month', inplace=True)
df = df.sort_index()
df.index.freq = 'MS'

print(f"Severity-weighted dataset compiled: {len(df)} months")
df.head()


# ## 2. Evaluation metrics

# In[3]:


def calculate_metrics(actual, predicted):
    actual, predicted = np.array(actual), np.array(predicted)
    mae = np.mean(np.abs(actual - predicted))
    rmse = np.sqrt(np.mean((actual - predicted) ** 2))
    wape = np.sum(np.abs(actual - predicted)) / np.sum(actual)
    return {"MAE": mae, "RMSE": rmse, "WAPE": wape}


# ## 3. Rolling-origin cross-validation

# In[4]:


initial_train_size = 24
predictions = []
actuals = []
test_timestamps = []

for t in range(initial_train_size, len(df)):
    train_slice = df.iloc[:t]
    test_slice = df.iloc[t:t + 1]

    y_train = train_slice["Total_Harm_Units"]
    actual_val = test_slice["Total_Harm_Units"].values[0]
    test_timestamps.append(test_slice.index[0])
    actuals.append(actual_val)

    mod = SARIMAX(
        endog=y_train,
        order=(1, 1, 1), seasonal_order=(1, 1, 1, 12),
        enforce_stationarity=False, enforce_invertibility=False
    )
    predictions.append(mod.fit(disp=False).forecast(steps=1).values[0])

print("--- Forecasting loop complete ---")


# ## 4. Results & plot

# In[5]:


metrics = calculate_metrics(actuals, predictions)
print("=== SARIMA | Harm-Weighted (ONS) ===")
print(f"  MAE : {metrics['MAE']:.2f}")
print(f"  RMSE: {metrics['RMSE']:.2f}")
print(f"  WAPE: {metrics['WAPE']:.4%}")

plt.figure(figsize=(12, 6))
plt.plot(test_timestamps, actuals, marker="o", label="Actuals",
         color="#1a365d", linewidth=3)
plt.plot(test_timestamps, predictions, marker="s", label="SARIMA",
         color="#d69e2e", linestyle="--")
plt.title("SARIMA Forecast — Harm-Weighted (ONS)", fontsize=14, fontweight="bold")
plt.xlabel("Month", fontsize=12)
plt.ylabel("Total ONS Harm", fontsize=12)
plt.legend(loc="upper left", frameon=True)
plt.tight_layout()
plt.show()


