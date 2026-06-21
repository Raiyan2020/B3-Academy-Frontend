'use client';

import { addNotification } from '@/features/account/services/account-records.service';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { CertificateRecord } from '../types/certificate.types';

const CERTIFICATES_KEY = 'b3-course-certificates';

export function getCertificates(userId?: string) {
  const all = readLocalStorageJson<CertificateRecord[]>(CERTIFICATES_KEY, []);
  return userId ? all.filter((certificate) => certificate.userId === userId) : all;
}

export function getOrCreateCertificate(input: {
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
}) {
  const existing = getCertificates(input.userId).find((certificate) => certificate.courseId === input.courseId);
  if (existing) return existing;

  const issuedAt = new Date().toISOString();
  const id = `B3-${input.courseId.toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const certificate: CertificateRecord = {
    id,
    ...input,
    issuedAt,
    downloadUrl: createCertificateDataUrl({
      id,
      issuedAt,
      userName: input.userName,
      courseTitle: input.courseTitle,
      instructorName: input.instructorName,
    }),
  };
  writeLocalStorageJson(CERTIFICATES_KEY, [certificate, ...getCertificates()]);
  addNotification({
    userId: input.userId,
    title: 'تم إصدار شهادة الدورة',
    body: `تم إصدار شهادة ${input.courseTitle}.`,
    href: '/dashboard/courses',
  });
  return certificate;
}

function createCertificateDataUrl(input: {
  id: string;
  issuedAt: string;
  userName: string;
  courseTitle: string;
  instructorName: string;
}) {
  const formattedDate = new Date(input.issuedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificate of Completion - ${input.userName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: 'Georgia', serif;
      color: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .cert-container {
      width: 842px;
      height: 595px;
      padding: 40px;
      background: #ffffff;
      box-sizing: border-box;
      border: 24px solid #064e3b;
      position: relative;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }
    .cert-border {
      border: 2px solid #a7f3d0;
      height: 100%;
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
      box-sizing: border-box;
    }
    .content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      box-sizing: border-box;
    }
    .header h1 {
      font-size: 28px;
      color: #064e3b;
      margin: 0 0 8px 0;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .header h2 {
      font-size: 14px;
      color: #047857;
      margin: 0;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 600;
    }
    .divider {
      width: 60px;
      height: 2px;
      background: #047857;
      margin: 16px auto;
    }
    .present {
      font-size: 14px;
      font-style: italic;
      color: #64748b;
      margin: 0 0 12px 0;
    }
    .name {
      font-size: 40px;
      color: #064e3b;
      margin: 0 0 16px 0;
      text-transform: uppercase;
      font-weight: 800;
      border-bottom: 2px solid #e2e8f0;
      display: inline-block;
      padding-bottom: 4px;
    }
    .reason {
      font-size: 16px;
      color: #475569;
      margin: 0 auto 12px auto;
      max-width: 520px;
      line-height: 1.5;
    }
    .course {
      font-size: 22px;
      font-weight: bold;
      color: #1e293b;
      margin: 0 0 8px 0;
      font-style: italic;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 16px;
      padding: 0 40px;
    }
    .footer-col {
      text-align: left;
    }
    .footer-col.right {
      text-align: right;
    }
    .footer-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .footer-val {
      font-size: 12px;
      font-weight: bold;
      color: #334155;
    }
    .seal {
      width: 70px;
      height: 70px;
      background: #064e3b;
      border-radius: 50%;
      border: 4px double #f1f5f9;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .seal-star {
      color: #a7f3d0;
      font-size: 24px;
    }
    @media print {
      body {
        background: none;
      }
      .cert-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="cert-container">
    <div class="cert-border"></div>
    <div class="content">
      <div class="header">
        <h1>B3 Academy</h1>
        <h2>Certificate of Completion</h2>
        <div class="divider"></div>
      </div>
      <div>
        <p class="present">This globally recognized certificate is proudly presented to</p>
        <h2 class="name">${input.userName}</h2>
        <p class="reason">In recognition of successfully fulfilling the requirements and demonstrating excellence in the course:</p>
        <p class="course">${input.courseTitle}</p>
      </div>
      <div class="footer">
        <div class="footer-col">
          <div class="footer-label">Issue Date</div>
          <div class="footer-val">${formattedDate}</div>
        </div>
        <div class="seal">
          <div class="seal-star">★</div>
        </div>
        <div class="footer-col right">
          <div class="footer-label">Certificate ID</div>
          <div class="footer-val">${input.id}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}
