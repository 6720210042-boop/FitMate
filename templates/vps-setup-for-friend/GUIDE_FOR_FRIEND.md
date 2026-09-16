# 📌 ข้อมูลและขั้นตอนสำหรับเพื่อนที่จะนำเว็บมาขึ้น VPS

---

## 💬 ข้อความที่ Copy ส่งให้เพื่อนได้ทันที

```text
สวัสดีครับ ข้อมูลสำหรับการขึ้นเว็บที่ VPS เครื่องเดียวกัน:

1. Server IP: 157.254.192.71
2. ให้ชี้ DNS (A Record) ของโดเมนเพื่อนมาที่ IP: 157.254.192.71
3. พอร์ตประจำแอปของเพื่อน: 3002 (ห้ามใช้ 3001 เพราะ FitMate ใช้อยู่)
4. ใน compose.yml ของเพื่อน ให้ตั้งค่า ports เป็น:
   ports:
     - "127.0.0.1:3002:3000"   # หรือพอร์ตภายในคอนเทนเนอร์ของเพื่อน
   container_name: friend-app  # (ห้ามซ้ำกับ fitmate-app)
5. โฟลเดอร์สำหรับวางงานบนเซิร์ฟเวอร์: ~/friend-project
6. สิ่งที่ต้องส่งกลับมาให้เรา:
   - โดเมนที่เพื่อนจะใช้
   - SSH Public Key (id_ed25519.pub หรือ id_rsa.pub)
```

---

## 🛠️ ขั้นตอนที่คุณต้องทำบน VPS เมื่อเพื่อนแจ้งโดเมนมา:

1. เชื่อมต่อ SSH เข้า VPS:
   ```bash
   ssh root@157.254.192.71
   ```

2. เพิ่ม SSH Key ของเพื่อนเข้าเครื่อง (เอา public key ของเพื่อนมาใส่):
   ```bash
   echo "คีย์ของเพื่อน_ssh-ed25519_AAAA..." >> ~/.ssh/authorized_keys
   ```

3. สร้างโฟลเดอร์และตั้งค่า Nginx ให้เว็บเพื่อน (แทนที่ `friend.dogaomshoo.online` ด้วยโดเมนจริง):
   ```bash
   mkdir -p ~/friend-project
   sudo tee /etc/nginx/conf.d/friend.conf > /dev/null << 'EOF'
   server {
       listen 80;
       server_name friend.dogaomshoo.online;

       location / {
           proxy_pass http://127.0.0.1:3002;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   EOF
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. ออกใบรับรอง SSL (HTTPS):
   ```bash
   sudo certbot --nginx -d friend.dogaomshoo.online
   ```
