แชร์สูตรอาหาร — เวอร์ชันสมาชิก 2 วิธี
====================================

ระบบที่มีใน ZIP
- ดูสูตรอาหารได้โดยไม่ต้องสมัคร
- สมัคร/เข้าสู่ระบบด้วยชื่อผู้ใช้ + รหัสผ่าน
- สมัคร/เข้าสู่ระบบด้วย Google
- ต้องเข้าสู่ระบบก่อนแชร์สูตร
- หนึ่งสูตรอัปโหลดรูปได้ 1 รูป (JPG/PNG/WEBP ไม่เกิน 5 MB)
- ค้นหาสูตร และเรียงมาใหม่/ยอดนิยม
- กดถูกใจสูตร
- ใช้ Supabase Auth, Database และ Storage

ข้อสำคัญ
เว็บไซต์นี้เป็นไฟล์หน้าเว็บที่พร้อมเชื่อมต่อ แต่ระบบออนไลน์จะทำงานจริงหลังสร้าง Supabase
และตั้งค่า Google OAuth ตามขั้นตอนด้านล่างก่อน ไม่มีบริการหลังบ้านที่ฝังบัญชีไว้ให้แล้ว
อย่าเผยแพร่ service_role key หรือรหัสผ่านฐานข้อมูลเด็ดขาด ใช้เฉพาะ anon/publishable key ในหน้าเว็บ

ขั้นตอน 1: สร้าง Supabase
1. เข้า https://supabase.com/ แล้วสร้างโปรเจกต์
2. ไปที่ SQL Editor > New query
3. เปิดไฟล์ supabase_setup.sql คัดลอกทั้งหมดไปวาง แล้วกด Run
4. ไปที่ Project Settings > API แล้วคัดลอก Project URL และ anon/public key
5. เปิด app.js แล้วแทนที่ค่า:
   const SUPABASE_URL = "ใส่_SUPABASE_PROJECT_URL";
   const SUPABASE_ANON_KEY = "ใส่_SUPABASE_ANON_KEY";

ขั้นตอน 2: เปิดสมัครด้วยชื่อผู้ใช้และรหัสผ่าน
1. ใน Supabase ไปที่ Authentication > Providers > Email
2. ปิด Confirm email (จำเป็น เพราะบัญชีชื่อผู้ใช้ไม่ได้ใช้อีเมลจริง)
3. Save
ระบบจะเปลี่ยนชื่อผู้ใช้เป็นอีเมลภายในรูปแบบ username@username.krua.invalid เพื่อให้ Supabase
จัดการรหัสผ่านแบบเข้ารหัสให้ ผู้ใช้ยังกรอกเพียงชื่อผู้ใช้และรหัสผ่านเท่านั้น
ชื่อผู้ใช้ใช้ a-z, 0-9, _ จำนวน 3–24 ตัว และต้องไม่ซ้ำกัน
รหัสผ่านขั้นต่ำ 8 ตัวอักษร

ขั้นตอน 3: เปิด Google Login
1. ใน Google Cloud Console สร้าง OAuth Client แบบ Web application
2. ตั้ง Authorized redirect URI เป็น:
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   (แทน YOUR_PROJECT_REF ด้วย Project Ref ของ Supabase)
3. คัดลอก Client ID และ Client Secret
4. Supabase > Authentication > Providers > Google เปิดใช้งาน แล้ววาง Client ID/Secret
5. Authentication > URL Configuration ตั้ง Site URL เป็น URL เว็บไซต์จริง
   และเพิ่ม URL เว็บไซต์ รวมถึง URL สำหรับทดสอบใน Redirect URLs
6. บันทึกค่า

ขั้นตอน 4: เปิดเว็บ
- ทดสอบง่าย ๆ ด้วยการเปิด index.html ผ่าน local web server
- เมื่อนำขึ้นโฮสต์ ให้ใช้ HTTPS และตั้ง URL เดียวกันใน Supabase URL Configuration
- GitHub Pages ใช้ได้สำหรับหน้าเว็บ static; ห้ามใส่ secret/service_role key ลงใน app.js

วิธีทดสอบ
1. สมัครด้วยชื่อผู้ใช้ใหม่และรหัสผ่าน
2. ออกจากระบบ แล้วลองเข้าสู่ระบบด้วยชื่อเดิม
3. ลองเข้าสู่ระบบด้วย Google
4. ลองแชร์สูตรพร้อมรูป 1 รูป
5. เปิดเว็บในหน้าต่างไม่ระบุตัวตนเพื่อตรวจว่าคนที่ยังไม่เข้าสู่ระบบดูสูตรได้

หมายเหตุการเชื่อมบัญชี
เวอร์ชันนี้รองรับการสมัคร 2 วิธีแยกกัน แต่ยังไม่ได้รวมบัญชีชื่อผู้ใช้กับ Google
ให้เป็นบัญชีเดียวกันอัตโนมัติ เพื่อป้องกันการยึดบัญชีจากการจับคู่ชื่อ/อีเมลโดยไม่ยืนยันตัวตน
ถ้าต้องการรวมบัญชีภายหลัง ควรทำ flow เชื่อมบัญชีจากในหน้าตั้งค่าหลังผู้ใช้ล็อกอินอยู่แล้วเท่านั้น

หากพบปัญหา
- "Invalid login credentials": ตรวจชื่อผู้ใช้/รหัสผ่าน และสมัครด้วยชื่อนั้นแล้วหรือยัง
- สมัครแล้วไม่เข้าสู่ระบบ: ตรวจว่า Confirm email ปิดอยู่
- Google redirect_uri_mismatch: ตรวจ callback URL ใน Google Cloud ให้ตรงกับ Supabase
- รูปอัปโหลดไม่ได้: ตรวจว่ารัน SQL setup สำเร็จ และล็อกอินแล้ว
- โหลดสูตรไม่ได้: ตรวจ URL และ anon key ใน app.js และดู error ใน Console

ไฟล์ใน ZIP
index.html             หน้าเว็บ
style.css              รูปแบบหน้าเว็บ
app.js                 ระบบหน้าเว็บและสมาชิก
supabase_setup.sql     ตาราง, RLS, trigger, storage policies
README_TH.txt          คู่มือตั้งค่าภาษาไทย
