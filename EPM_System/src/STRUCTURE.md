# EPM 專案戰情室 - 檔案結構說明

## 目錄架構

```
src/
├── App.tsx                         # 主入口，整合 Dashboard / Detail 切換
├── App.css                         # 全域樣式
├── main.tsx                        # React 掛載點
├── index.css                       # 基礎 CSS 與 body
├── STRUCTURE.md                    # 本文件
│
├── assets/                         # 靜態資源（圖示、hero 圖等）
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg
│
├── constants/
│   └── storage.ts                  # LocalStorage 鍵名常數
│
├── types/
│   └── index.ts                    # Project / PdfData / Filter / ViewMode 等型別
│
├── parsers/                        # 檔案解析層
│   ├── htmlParser.ts               # 傳票 HTML 解析
│   ├── excelParser.ts              # 工具交期、備料、在站進度 Excel
│   ├── travelerParser.ts           # Traveler 手順書 Excel
│   └── index.ts
│
├── hooks/                          # 自訂狀態邏輯
│   ├── useEPMStore.ts              # 全域狀態與 localStorage 同步
│   └── useProjectAlerts.ts         # 預警計算（模治具/零件）
│
├── context/
│   ├── EPMContext.tsx              # Context 型別與 useEPM
│   └── EPMProvider.tsx             # Provider（包 useEPMStore）
│
├── utils/                          # 純函式工具
│   ├── dateUtils.ts
│   ├── stationUtils.ts
│   ├── dashboardFilterUtils.ts     # 搜尋/篩選/排序輔助
│   ├── projectAlertsCompute.ts     # 預警欄位計算
│   ├── productionProgressUtils.ts  # 生產進度計算
│   ├── propertyManagementProgressUtils.ts  # 物管進度計算
│   ├── shippingSafetyRateUtils.ts  # 出貨/安全庫存相關計算
│   ├── wipLookupUtils.ts           # WIP / 在站查詢輔助
│   └── index.ts
│
├── components/
│   ├── HeaderPanel/                # 頂部匯入區（傳票/工具/備料/站點）
│   │   ├── HeaderPanel.tsx
│   │   ├── HeaderPanel.module.css
│   │   └── index.ts
│   ├── SearchFilterBar/            # 搜尋 + 六欄篩選 + 排序 + 重置
│   │   ├── SearchFilterBar.tsx
│   │   ├── SearchFilterBar.module.css
│   │   ├── SearchFilterHeader.tsx
│   │   ├── SearchFilterSearchInput.tsx
│   │   ├── SearchFilterBottomRow.tsx
│   │   ├── DashboardFilterFieldsRow.tsx
│   │   ├── useDashboardProjectFilter.ts    # 篩選狀態與可見資料 hook
│   │   ├── filterIcons.tsx
│   │   ├── types.ts
│   │   └── index.ts
│   ├── ProjectCard/                # 卡片檢視（含生產、物管、出貨/安全庫存區）
│   │   ├── ProjectCard.tsx
│   │   ├── ProductionProgressSection.tsx
│   │   ├── PropertyManagementProgressSection.tsx
│   │   ├── ShippingSafetyRateSection.tsx
│   │   ├── ProjectCard.module.css
│   │   ├── ProductionProgressSection.module.css
│   │   ├── PropertyManagementProgressSection.module.css
│   │   ├── ShippingSafetyRateSection.module.css
│   │   └── index.ts
│   ├── ProjectTable/               # 表格檢視
│   │   ├── ProjectTable.tsx
│   │   ├── ProjectTable.module.css
│   │   └── index.ts
│   └── PdfResultSection/           # Traveler 解析結果（零件/模治具/補材/站點）
│       ├── PdfResultSection.tsx
│       ├── PdfResultSection.module.css
│       └── index.ts
│
└── views/
    ├── DashboardView/              # 戰情儀表板（列表頁）
    │   ├── DashboardView.tsx
    │   ├── DashboardView.module.css
    │   └── index.ts
    └── DetailView/                 # 專案詳情（手順書匯入與結果）
        ├── DetailView.tsx
        ├── DetailView.module.css
        └── index.ts
```

## 功能分類

| 分類 | 職責 |
|------|------|
| **constants** | 固定鍵名與常數 |
| **types** | 跨模組共用型別 |
| **parsers** | 來源檔案解析（HTML / Excel） |
| **hooks** | 狀態封裝與副作用邏輯 |
| **context** | 全域狀態注入 |
| **utils** | 純函式計算（篩選、預警、站點、進度、WIP、出貨/安全庫存） |
| **components** | 可重用 UI 元件與區塊 |
| **views** | 頁面組裝與使用者流程 |

## 主要資料流

1. **HeaderPanel** 觸發匯入，交由 `parsers` 解析，透過 `useEPMStore` 寫入狀態與 LocalStorage。
2. **DashboardView** 使用 `useDashboardProjectFilter` 取得搜尋/篩選/排序後資料，並切換卡片或表格顯示。
3. 點擊專案進入 **DetailView**，可更新工單、上傳 Traveler，並由 `travelerParser` 產生 `pdfData`。
4. **ProjectCard** 內生產/物管/出貨安全等區塊，搭配 `utils` 內對應計算邏輯顯示摘要。
5. **PdfResultSection** 以 `project.pdfData` 與交期 map 比對，顯示零件、模治具、補材與站點結果。
