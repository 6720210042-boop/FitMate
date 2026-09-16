#!/bin/bash
# ==============================================================================
# สคริปต์เตรียมความพร้อม VPS เพื่อรองรับโปรเจกต์ของเพื่อน
# รันบนเครื่อง VPS: bash setup-vps-for-friend.sh <DOMAIN_OF_FRIEND>
# ==============================================================================

set -e

FRIEND_DOMAIN="$1"

if [ -z "$FRIEND_DOMAIN" ]; then
    echo "❌ กรุณาระบุโดเมนของเพื่อนด้วย เช่น:"
    echo "   bash setup-vps-for-friend.sh friend.dogaomshoo.online"
    exit 1
fi

echo "🚀 [1/4] กำลังสร้างโฟลเดอร์สำหรับโปรเจกต์เพื่อน (~/friend-project)..."
mkdir -p ~/friend-project

echo "🛡️ [2/4] ตรวจสอบ Swap Memory ป้องกัน RAM เต็ม..."
SWAP_TOTAL=$(free -m | awk '/Swap:/ {print $2}')
if [ "$SWAP_TOTAL" -eq "0" ]; then
    echo "⚠️ ไม่พบ Swap File กำลังสร้าง Swap ขนาด 2GB เพื่อป้องกัน RAM เต็ม..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ สร้าง Swap 2GB สำเร็จแล้ว!"
else
    echo "✅ ระบบมี Swap อยู่แล้ว ($SWAP_TOTAL MB)"
fi

echo "🌐 [3/4] กำลังสร้าง Nginx Reverse Proxy ชี้ไปที่พอร์ต 3002..."
sudo tee /etc/nginx/conf.d/friend.conf > /dev/null <<EOF
server {
    listen 80;
    server_name ${FRIEND_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo nginx -t
sudo systemctl reload nginx
echo "✅ ตั้งค่า Nginx เรียบร้อยแล้ว!"

echo "🔒 [4/4] วิธีการออก SSL (HTTPS):"
echo "   เมื่อเพื่อนชี้ DNS A Record มาที่ IP เครื่องนี้เรียบร้อยแล้ว ให้รันคำสั่ง:"
echo "   sudo certbot --nginx -d ${FRIEND_DOMAIN}"
echo ""
echo "🎉 เสร็จสมบูรณ์! แจ้งเพื่อนให้นำโปรเจกต์มาวางที่ ~/friend-project และรันพอร์ต 3002 ได้เลย"
