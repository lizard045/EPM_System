/**
 * 傳票 HTML 解析
 */

import type { Project } from '../types';

function getVal(doc: Document, id: string): string {
  const el = doc.getElementById(id);
  return (el instanceof HTMLInputElement ? el.value : el?.textContent ?? '').trim();
}

/**
 * 從 HTML 字串解析出傳票專案
 */
export function parseVoucherHtml(html: string): Omit<Project, 'id'> | null {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  let formNo = (doc.body.innerText.match(/F0\d{2}-\d{8,10}/i) ?? [''])[0].toUpperCase();
  if (formNo.includes('關閉') || formNo.includes('視窗')) formNo = '';

  const wordSel = doc.getElementById(
    'ctl00_ContentPlaceHolder1_ctl17_versionFieldUC5_UCMakeContactVoucherMPN_UCMPN_ddlMPNword'
  );
  const mpnPrefix =
    wordSel?.querySelector('option[selected]')?.textContent ?? '';
  let mpnNo = getVal(doc, 'ctl00_ContentPlaceHolder1_ctl17_versionFieldUC5_UCMakeContactVoucherMPN_UCMPN_txtMPNno');
  let mpnSub = getVal(doc, 'ctl00_ContentPlaceHolder1_ctl17_versionFieldUC5_UCMakeContactVoucherMPN_UCMPN_txtMPNsubno');
  let mpnStr = (mpnPrefix + mpnNo + (mpnSub ? `-${mpnSub}` : '')).trim();

  if (!mpnStr || mpnStr === '-') {
    const tds = Array.from(doc.querySelectorAll('td'));
    const mpnLabel = tds.find((t) => t.textContent?.includes('品目番號'));
    mpnStr = mpnLabel?.nextElementSibling?.textContent?.trim() ?? '未知品目';
  }

  return {
    formNo,
    mpn: mpnStr,
    qty: getVal(doc, 'ctl00_ContentPlaceHolder1_ctl17_versionFieldUC5_txtTestQty') || '0',
    deadline: getVal(doc, 'ctl00_ContentPlaceHolder1_ctl17_versionFieldUC5_wdcTestDeadline_dateInput') || '未定',
    workOrder: '',
    pdfParsed: false,
    pdfData: null,
    isArchived: false,
    createdAt: new Date().toISOString(),
    priority: '一般',
    epmName: '',
    customer: '',
  };
}
