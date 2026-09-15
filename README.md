# 🏋️ FitMate - ระบบวางแผนสุขภาพและการออกกำลังกายเฉพาะบุคคล

> **Production URL:** [https://dogaomshoo.online](https://dogaomshoo.online) (HTTPS 🔒)  
> **VPS Host IP:** `157.254.192.71`  
> **Docker Hub Image:** [`6720210042/fitmate-app:main`](https://hub.docker.com/r/6720210042/fitmate-app)

---

## 📌 ภาพรวมสถาปัตยกรรมระบบ (Deployment Architecture)

```
[ Browser / User ]
       │
       ▼ HTTPS (Port 443) / HTTP (Port 80 -> Auto Redirect 301)
[ Domain & DNS: dogaomshoo.online ]
       │ A Record
       ▼
[ VPS: Sundae Cloud Ubuntu Server (157.254.192.71) ]
       │
       ├── UFW Firewall (อนุญาตเฉพาะ 22:OpenSSH, 80/443:Nginx Full)
       │
       ├── [ Nginx Reverse Proxy + Let's Encrypt SSL ]
       │      │
       │      ▼ proxy_pass http://127.0.0.1:3001
       │
       └── [ Docker Engine & Docker Compose ]
              │
              └── Next.js Container (FitMate Standalone)
                  - Port Mapping: 127.0.0.1:3001:3000 (Loopback only)
                  - Non-root user: nextjs:nodejs (UID/GID 1001)
```

---

## 🛠️ เทคโนโลยีที่ใช้งาน (Tech Stack)

- **Frontend & Core Framework:** Next.js (App Router), React 19, TypeScript
- **Styling:** Vanilla CSS & Modern Component Tokens
- **Containerization:** Docker (Multi-stage build & Standalone output), Docker Compose v2
- **Web Server & Reverse Proxy:** Nginx with HTTP/2 and TLS termination
- **SSL / TLS Certificate:** Let's Encrypt via Certbot (Auto Renewal enabled)
- **CI/CD Automation:** GitHub Actions + Docker Hub Registry
- **Cloud Infrastructure:** VPS Ubuntu 26.04 LTS

---

## 🚀 การติดตั้งและรันระบบ (Deployment Guide)

### 1. การรันในโหมดพัฒนา (Local Development)

```bash
npm install
npm run dev
```
เปิดใช้งานที่: `http://localhost:3000`

### 2. การสร้าง Container และรันด้วย Docker Compose

```bash
# ทดสอบ Build ภาพอิมเมจ
docker build -t fitmate-app:v1 .

# รันระบบด้วย Docker Compose
docker compose up -d

# ตรวจสอบสถานะการทำงาน
docker compose ps
docker compose logs -f app
```

---

## 🔄 ระบบ CI/CD อัตโนมัติ (Automated Deployment Pipeline)

ระบบติดตั้ง GitHub Actions Workflow ไว้ที่ `.github/workflows/deploy.yml`:
1. **Trigger:** เกิดขึ้นอัตโนมัติเมื่อมีการ `push` หรือ `merge pull request` เข้าสู่กิ่ง `main`
2. **Build & Push:** GitHub Actions รันการ Build Docker Image แบบ Multi-stage และส่งขึ้น Docker Hub Registry (`6720210042/fitmate-app:main`)
3. **Deploy to VPS:** เชื่อมต่อ SSH เข้าไปยัง VPS (`157.254.192.71`) สั่ง `docker compose pull` และ `docker compose up -d` โดยอัตโนมัติแบบ Zero Downtime

---

## 🛡️ มาตรการความปลอดภัย (Security Practices)

1. **Loopback Port Binding:** พอร์ตของคอนเทนเนอร์ถูก Map ไว้ที่ `127.0.0.1:3001:3000` เท่านั้น ป้องกันไม่ให้อินเทอร์เน็ตภายนอกเข้าถึงคอนเทนเนอร์โดยตรง
2. **UFW Firewall:** เปิดรับทราฟฟิกเฉพาะพอร์ตที่จำเป็น (22 สำหรับ SSH, 80 สำหรับ HTTP และ 443 สำหรับ HTTPS)
3. **Non-root Execution:** ภายในคอนเทนเนอร์รันด้วยผู้ใช้ `nextjs` (UID 1001) แทนการใช้สิทธิ์ `root`
4. **Secret Management:** ไม่มีการเก็บรหัสผ่านหรือ Private Key ใน Source Code ข้อมูลสำคัญทั้งหมดถูกจัดเก็บใน **GitHub Secrets** และไฟล์ `.env` บน VPS

---

## 🔍 คู่มือแก้ปัญหาและตรวจสอบระบบ (Troubleshooting Guide)

| อาการ / ปัญหา | คำสั่งตรวจสอบ | แนวทางแก้ไข |
| :--- | :--- | :--- |
| **502 Bad Gateway** | `curl -I http://127.0.0.1:3001`<br>`docker compose ps` | คอนเทนเนอร์อาจหยุดทำงาน ให้ตรวจ log ด้วย `docker compose logs -f app` แล้วสั่ง `docker compose up -d` |
| **Nginx Config ผิดพลาด** | `sudo nginx -t` | ตรวจสอบ syntax ใน `/etc/nginx/conf.d/app.conf` ให้ถูกต้องก่อน `sudo systemctl reload nginx` |
| **ดู Error Logs ของ Nginx** | `sudo tail -f /var/log/nginx/error.log` | ตรวจสอบ error การเชื่อมต่อไปยัง upstream backend |
| **SSL หมดอายุ / ต่ออายุ** | `sudo certbot renew --dry-run` | ทดสอบการจำลองต่ออายุใบรับรองอัตโนมัติ |
| **ตรวจการ Listen พอร์ต** | `ss -tulpn` | ดูว่ามีโพรเซสใดกำลังเปิดรับคำขอที่พอร์ต 80, 443 หรือ 3001 |
| **ตรวจสถานะ DNS Record** | `dig +short dogaomshoo.online`<br>`nslookup dogaomshoo.online` | ตรวจดูว่าโดเมนชี้มาที่ IP `157.254.192.71` ถูกต้องหรือไม่ |
