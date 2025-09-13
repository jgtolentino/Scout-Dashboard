import argparse, os, pandas as pd
from xlsxwriter import Workbook

def load_csv(csvdir, name, cols):
    path = os.path.join(csvdir, f"{name}.csv")
    if os.path.exists(path):
        try:
            return pd.read_csv(path)
        except Exception:
            pass
    return pd.DataFrame(columns=cols)

def write_table(ws, df, tname):
    # headers
    for c, col in enumerate(df.columns):
        ws.write(0, c, col)
    # data
    for r, row in enumerate(df.itertuples(index=False), start=1):
        for c, val in enumerate(row):
            ws.write(r, c, (None if pd.isna(val) else val))
    last_row = max(1, len(df))  # header row + data rows - 1
    last_col = max(1, len(df.columns)) - 1
    ws.add_table(0, 0, last_row, last_col, {
        "name": tname, "columns": [{"header": col} for col in df.columns] or [{"header":"empty"}]
    })

def add_pivot(wb, wsname, data_ws, df, rows, cols=None, values=None, filters=None):
    ws = wb.add_worksheet(wsname[:31])
    ncols = max(1, len(df.columns))
    nrows = len(df) + 1  # header included
    col_end = chr(64+ncols) if ncols <= 26 else 'Z'  # simple cap
    data_range = f"'{data_ws}'!$A$1:${col_end}${nrows}"
    try:
        wb.add_pivot_table({
            "data": data_range,
            "worksheet": ws,
            "name": f"PV_{wsname[:25]}",
            "row_fields": rows or [],
            "column_fields": cols or [],
            "filter_fields": filters or [],
            "data_fields": values or [],
            "destination": "A3",
        })
    except Exception as e:
        ws.write(0,0, f"Pivot could not be created: {e}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csvdir", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    os.makedirs(os.path.dirname(args.out), exist_ok=True)

    # Load CSVs or fallbacks
    df_default = load_csv(args.csvdir, "scout_default_view",
                          ["transaction_id","storeid","category (correct)","brand","product","payment_method","qty","unit_price","total_price","brand_raw"])
    df_lookup  = load_csv(args.csvdir, "category_lookup_reference",
                          ["Correct Category","Category Code","Level","Example SKU","Example Brand"])
    df_cb      = load_csv(args.csvdir, "category_brand",
                          ["category","brand","line_count","sales"])
    df_tob     = load_csv(args.csvdir, "tobacco",
                          ["weekday","transactions","avg_qty","avg_total_price"])
    df_lau     = load_csv(args.csvdir, "laundry",
                          ["Correct Category","Laundry","Avg Qty","Avg Total Price"])

    wb = Workbook(args.out)

    # Data sheets
    ws_def = wb.add_worksheet("Data_scout_default_view")
    write_table(ws_def, df_default, "T_scout_default_view")
    ws_lkp = wb.add_worksheet("Data_category_lookup_reference")
    write_table(ws_lkp, df_lookup, "T_category_lookup_reference")
    ws_cb  = wb.add_worksheet("Data_category_brand")
    write_table(ws_cb, df_cb, "T_category_brand")
    ws_tob = wb.add_worksheet("Data_tobacco")
    write_table(ws_tob, df_tob, "T_tobacco")
    ws_lau = wb.add_worksheet("Data_laundry")
    write_table(ws_lau, df_lau, "T_laundry")

    # Pivots
    add_pivot(wb, "Sheet 1 - scout_default_view", "Data_scout_default_view", df_default,
              rows=["category (correct)","brand"],
              values=[{"name":"Sum of total_price","field":"total_price","function":"sum"},
                      {"name":"Sum of qty","field":"qty","function":"sum"}])

    add_pivot(wb, "Category Lookup Reference", "Data_category_lookup_reference", df_lookup,
              rows=["Correct Category"],
              values=[{"name":"Count of Category Code","field":"Category Code","function":"count"}])

    add_pivot(wb, "Catergory and Brand", "Data_category_brand", df_cb,
              rows=["category","brand"],
              values=[{"name":"Lines","field":"line_count","function":"sum"},
                      {"name":"Sales","field":"sales","function":"sum"}])

    add_pivot(wb, "Tobacco", "Data_tobacco", df_tob,
              rows=["weekday"],
              values=[{"name":"Transactions","field":"transactions","function":"sum"},
                      {"name":"Avg Qty","field":"avg_qty","function":"average"},
                      {"name":"Avg Total Price","field":"avg_total_price","function":"average"}])

    add_pivot(wb, "Laundry", "Data_laundry", df_lau,
              rows=["Correct Category"],
              values=[{"name":"Count","field":"Laundry","function":"sum"},
                      {"name":"Avg Qty","field":"Avg Qty","function":"average"},
                      {"name":"Avg Total Price","field":"Avg Total Price","function":"average"}])

    wb.close()

if __name__ == "__main__":
    main()