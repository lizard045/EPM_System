# 硬體 EPM 專案戰情室（NPI）

本專案為 **NPI 專案戰情儀表板** 前端應用（對應頁面標題 **V38.0 雙模式版**），用於集中匯入傳票、工具交期、零件備料、在站 WIP／站點、補材採購與 Traveler 手順書，並在儀表板以卡片或表格檢視多筆傳票，進入詳情後比對手順書與 Excel 交期資料，輔助追蹤生產、物管與出貨安全相關狀態。  
**無後端伺服器**：所有資料儲存在瀏覽器 **LocalStorage**，重新整理後仍保留（除非清除或換瀏覽器／設定檔）。

---

## 技術棧

| 項目 | 說明 |
|------|------|
| 執行環境 | 現代瀏覽器（需支援 `FileReader`、`DOMParser`、`localStorage`） |
| 框架 | React 19、TypeScript |
| 建置 | Vite 8 |
| 表格解析 | `xlsx`（讀取 `.xls` / `.xlsx`） |
| 狀態 | React Context + 自訂 `useEPMStore`（與 LocalStorage 雙向同步） |

---

## 應用程式流程

1. **戰情儀表板（`DashboardView`）**  
   頂部匯入區載入各來源檔 → 中間 **搜尋／篩選／排序** → 下方以 **卡片** 或 **表格** 顯示符合條件且未結案之傳票。

2. **專案詳情（`DetailView`）**  
   點選單一傳票後進入：可編輯工單、維護 **材料工單**（對應手順書「材」製程段）、上傳 **Traveler 手順書 Excel**；下方 **`PdfResultSection`** 依已匯入的全域 Excel map 與手順書內容，顯示零件／模治具／補材／站點與材料製程等比對結果。

3. **返回列表**  
   關閉詳情後回到儀表板；`currentProjectId` 僅存在記憶體層，不寫入 LocalStorage。

---

## 功能說明

### 1. 資料匯入（`HeaderPanel`）

匯入區分兩頁（以 **↑／↓** 切換）：

| 順序 | 名稱 | 檔案類型 | 用途 |
|------|------|----------|------|
| 1 | 傳票 | `.html`（可多檔） | 解析為單筆 **專案（傳票）**：表單編號、品目（MPN）、數量、交期等；重複表單編號會提示；若該傳票曾結案可選擇恢復顯示。 |
| 2 | 工具交期 | Excel `.xlsx` / `.xls` | 建立 **品目 → 工具交期文字** 對照表，供物管進度與詳情比對。 |
| 3 | 零件備料 | Excel | 建立 **表單編號（大寫）→ 備料進度文字** 對照表，供零件列表與預警。 |
| 4 | 目前站點／WIP | Excel | 寫入 **工單 → 工程站／在站文字**，並合併 **WIP 快照**（在站製程、IPQC、張數、投料目標量等，供生產進度、站點顯示、出貨安全率計算）。可重複匯入合併多張表。 |
| 5 | 新原物料異常／補材 | Excel（第二頁） | 建立 **LOT NO → 採購交期** 對照，供補材與物管區塊比對。 |

- **清除所有暫存**：清空 LocalStorage 內本應用相關資料並重置列表（需確認）。  
- 各步驟成功後多以 `window.alert` 簡短提示。

### 2. 戰情儀表板列表

- **搜尋**：品目（MPN）或工單關鍵字（不分大小寫子字串）。  
- **篩選維度**（見 `SearchFilterBar` / `types.ts`）：  
  - 傳票狀態（全部／未匯入手順書／已匯入／模治具未齊／零件備料未齊）  
  - 優先度、EPM、客戶、**目前站點**（選項由已載入之站點表動態彙整）  
  - 建立日期區間（今日、本週、本月、近 30 天等）  
- **排序**：建立日期、品目、工單、交期等多種模式循環切換。  
- **檢視模式**（`SearchFilterHeader`）：**卡片**／**表格**，偏好寫入 LocalStorage。  
- **計數**：顯示「符合篩選筆數／進行中傳票總數」；無進行中或無符合條件時顯示對應空狀態文案。

### 3. 專案卡片（`ProjectCard`）

每張卡片呈現傳票摘要欄位，並依 Context 內資料計算：

- **目前站點**：結合工單、手順書站點、站點表與 WIP 快照（無工單時亦可嘗試依品目對到 WIP）。  
- **生產進度**（`sections/ProductionProgressSection`）：WIP 與手順書站點對齊、百分比、日期、IPQC、流程階段等。  
- **出貨安全率（pcs）**（`ShippingSafetyRateSection`）：傳票數量與 WIP 在線量、需求量刻度與建議補投等（有資料時才顯示）。  
- **物管進度**（`PropertyManagementProgressSection`）：零件／模治具／補材與 Excel／手順書的對應與待辦提示。  
- **預警條**：模治具尚未備齊、零件尚未備料齊全（與列表「狀態篩選」邏輯一致）。

卡片邏輯集中於 **`useProjectCardData`**，子區塊置於 **`ProjectCard/sections/`**。

### 4. 專案詳情頁（`DetailView`）

- 顯示與編輯 **工單**。  
- **材料工單**：依手順書 **(材)** 製程段數（如 F03、P04…）對應多欄工單字串；匯入新手順書時會保留既有欄位長度對齊。  
- **Traveler 手順書**：上傳 Excel 後由 **`parseTravelerExcel`** 解析為 `pdfData`（零件、模治具、補材、一般製程站點、**材料製程段 `materialRoutes`** 等）；上傳前會做 **品目與傳票 MPN** 的簡易比對，不符則拒絕寫入。  
- **結案**：將傳票標為 `isArchived`，並關閉詳情頁。  
- **`PdfResultSection`**：在已匯入手順書前提下，列出手順書中的零件（並嘗試從備料 map 擷取交期字樣）、模治具、補材、站點與材料段與 WIP／工單的對應說明等（細節以實際 UI 為準）。

### 5. 資料模型重點（`types/index.ts`）

- **`Project`**：傳票主檔；`pdfData` 為手順書解析結果；`materialWorkOrders` 為材料段對應工單陣列（舊欄 `materialWorkOrder` 仍相容讀取）。  
- **`PdfData`**：`parts`、`jigs`、`consumables`、`stations`、`materialRoutes`。  
- **預警 `ProjectAlerts`**：由 **`computeProjectAlerts`** 依工具／備料文字與手順書內容推導。

---

## 資料持久化（LocalStorage）

鍵名定義於 `src/constants/storage.ts`，主要包括：

| 鍵常數 | 用途 |
|--------|------|
| `PROJECTS` | 傳票列表 |
| `TOOLS` | 工具交期 map |
| `PARTS` | 零件備料 map |
| `STATIONS` | 工單 → 站點進度字串 |
| `WIP_SNAPSHOTS` | 工單 → WIP 快照（正規化後儲存） |
| `MATERIAL_LOT` | LOT → 補材採購交期 |
| `VIEW_MODE` | `card` / `table` |

舊版曾將 WIP 嵌在 `STATIONS` 的結構中，載入時會由 **`splitPersistedStations`** 拆回站點與 WIP，避免資料錯置。

---

## 程式結構

- 目錄樹與模組職責說明：**[src/STRUCTURE.md](src/STRUCTURE.md)**  
- **業務計算**請優先自 **`src/utils/index.ts`**（barrel）匯入，便於統一管理與重構。

主要目錄：`parsers`（HTML／Excel 解析）、`hooks`（`useEPMStore`、`useProjectAlerts`）、`context`、`utils`、`components`、`views`。

---

## 開發指令

於本目錄 `EPM_System` 執行：

```bash
npm install
npm run dev
```

- **`npm run dev`**：啟動 Vite 開發伺服器。  
- **`npm run build`**：`tsc -b` 型別檢查後產出正式組建。  
- **`npm run preview`**：預覽正式組建。  
- **`npm run lint`**：執行 ESLint。

---

## 使用注意

1. **敏感與容量**：資料僅存在本機瀏覽器，清除網站資料或換電腦即遺失；大量傳票與 Excel map 會佔用 LocalStorage 配額。  
2. **檔案格式**：HTML 傳票與各 Excel 欄位需與現有解析器假設一致（見 `parsers` 內實作）；格式變更時需同步調整解析邏輯。  
3. **無登入與權限**：本應用未內建帳號體系，適合內網或本機 NPI 輔助場景。

---

## 授權

`package.json` 標示為 `private: true`；若需對外發佈請自行補上授權條款與公司規範。
