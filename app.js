// 1) ใส่ Project URL และ anon/publishable key จาก Supabase ในสองบรรทัดนี้
const SUPABASE_URL = "ใส่_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "ใส่_SUPABASE_ANON_KEY";

const $ = (id) => document.getElementById(id);
const ready = SUPABASE_URL.startsWith("https://") && !SUPABASE_ANON_KEY.startsWith("ใส่_");
const db = ready ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let currentUser = null, sortMode = "new", recipes = [], signupMode = false;

function message(id, text, good=false){ const el=$(id); el.textContent=text; el.style.color=good?"#426b3b":"#b44d2b"; }
function usernameEmail(name){ return `${name.trim().toLowerCase()}@username.krua.invalid`; }
function safeUsername(name){ return /^[a-zA-Z0-9_]{3,24}$/.test(name); }
function requireConfig(){ if(!db){ alert("ยังไม่ได้เชื่อม Supabase กรุณาทำตาม README_TH.txt ก่อน"); return false;} return true; }
function showAuth(mode="login"){ signupMode=mode==="signup"; $("show-login").classList.toggle("active",!signupMode); $("show-signup").classList.toggle("active",signupMode); $("confirm-wrap").classList.toggle("hidden",!signupMode); $("password-submit").textContent=signupMode?"สมัครสมาชิก":"เข้าสู่ระบบ"; $("auth-password").autocomplete=signupMode?"new-password":"current-password"; $("auth-message").textContent=""; $("auth-dialog").showModal(); }
function updateAccount(){ $("login-open").classList.toggle("hidden",!!currentUser); $("logout").classList.toggle("hidden",!currentUser); $("user-label").textContent=currentUser?`สวัสดี ${currentUser.user_metadata?.username || currentUser.user_metadata?.full_name || "สมาชิก"}`:""; }
async function loadRecipes(){
  if(!db){ $("recipe-list").innerHTML='<div class="empty">เชื่อมต่อ Supabase ก่อน จึงจะแสดงสูตรอาหารจากสมาชิกได้</div>'; return; }
  const {data,error}=await db.from("recipes").select("id,title,original_dish,description,image_url,created_at,user_id,likes(count),profiles(username)").order("created_at",{ascending:false}).limit(60);
  if(error){ $("recipe-list").innerHTML='<div class="empty">โหลดสูตรไม่สำเร็จ ตรวจสอบการตั้งค่าฐานข้อมูลใน README</div>'; console.error(error); return; }
  recipes=data||[]; renderRecipes();
}
function renderRecipes(){
  const q=$("search").value.trim().toLowerCase();
  let list=recipes.filter(r=>[r.title,r.original_dish,r.description].join(" ").toLowerCase().includes(q));
  if(sortMode==="popular") list.sort((a,b)=>(b.likes?.[0]?.count||0)-(a.likes?.[0]?.count||0));
  if(!list.length){ $("recipe-list").innerHTML='<div class="empty">ยังไม่พบสูตรที่ค้นหา ลองค้นคำอื่นดูนะ</div>'; return; }
  $("recipe-list").innerHTML=list.map(r=>`<article class="recipe-card"><img src="${escapeHtml(r.image_url)}" alt="${escapeHtml(r.title)}" loading="lazy"><div class="recipe-body"><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.description||r.original_dish||"สูตรสร้างสรรค์จากสมาชิกครัวทดลอง")}</p><div class="recipe-meta"><span>โดย ${escapeHtml(r.profiles?.username||"สมาชิก")}</span><button class="like" data-like="${r.id}">♥ ${r.likes?.[0]?.count||0}</button></div></div></article>`).join("");
  document.querySelectorAll("[data-like]").forEach(b=>b.addEventListener("click",()=>likeRecipe(b.dataset.like)));
}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function likeRecipe(id){ if(!currentUser){showAuth();return;} const {error}=await db.from("likes").insert({recipe_id:id,user_id:currentUser.id}); if(error && error.code!=="23505") alert("กดถูกใจไม่สำเร็จ"); await loadRecipes(); }
async function syncSession(){ if(!db)return; const {data}=await db.auth.getSession(); currentUser=data.session?.user||null; updateAccount(); }
$("login-open").onclick=()=>showAuth(); $("show-login").onclick=()=>showAuth("login"); $("show-signup").onclick=()=>showAuth("signup");
$("logout").onclick=async()=>{await db.auth.signOut();currentUser=null;updateAccount();loadRecipes();};
$("password-form").addEventListener("submit",async e=>{
 e.preventDefault(); if(!requireConfig())return;
 const username=$("auth-username").value.trim(), password=$("auth-password").value;
 if(!safeUsername(username)){message("auth-message","ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษ ตัวเลข หรือ _ จำนวน 3–24 ตัว");return;}
 if(signupMode){
  if(password.length<8){message("auth-message","รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");return;}
  if(password!==$("auth-confirm").value){message("auth-message","รหัสผ่านที่ยืนยันไม่ตรงกัน");return;}
  const {data,error}=await db.auth.signUp({email:usernameEmail(username),password,options:{data:{username}}});
  if(error){message("auth-message",error.message);return;}
  if(data.session){currentUser=data.user;updateAccount();$("auth-dialog").close();loadRecipes();}
  else message("auth-message","สมัครแล้ว หากระบบแจ้งให้ยืนยันอีเมล แสดงว่ายังไม่ได้ปิด Email Confirm ใน Supabase",true);
 }else{
  const {data,error}=await db.auth.signInWithPassword({email:usernameEmail(username),password});
  if(error){message("auth-message","เข้าสู่ระบบไม่สำเร็จ ตรวจชื่อผู้ใช้และรหัสผ่าน");return;}
  currentUser=data.user;updateAccount();$("auth-dialog").close();loadRecipes();
 }
});
$("google-login").onclick=async()=>{if(!requireConfig())return;const {error}=await db.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});if(error)message("auth-message",error.message);};
$("post-open").onclick=()=>{if(!currentUser){showAuth();message("auth-message","เข้าสู่ระบบก่อนจึงจะแชร์สูตรได้");return;} $("post-dialog").showModal();};
$("recipe-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!requireConfig()||!currentUser)return;
 const file=$("recipe-image").files[0];if(!file){message("recipe-message","กรุณาเลือกรูปภาพ 1 รูป");return;}
 if(file.size>5*1024*1024){message("recipe-message","รูปภาพต้องมีขนาดไม่เกิน 5 MB");return;}
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)){message("recipe-message","รองรับไฟล์ JPG, PNG หรือ WEBP เท่านั้น");return;}
 $("recipe-submit").disabled=true;message("recipe-message","กำลังอัปโหลด…",true);
 const ext=file.name.split(".").pop().toLowerCase(), path=`${currentUser.id}/${crypto.randomUUID()}.${ext}`;
 const up=await db.storage.from("recipe-images").upload(path,file,{contentType:file.type,upsert:false});
 if(up.error){message("recipe-message","อัปโหลดรูปไม่สำเร็จ: "+up.error.message);$("recipe-submit").disabled=false;return;}
 const {data:{publicUrl}}=db.storage.from("recipe-images").getPublicUrl(path);
 const {error}=await db.from("recipes").insert({user_id:currentUser.id,title:$("recipe-title").value.trim(),original_dish:$("recipe-original").value.trim(),description:$("recipe-description").value.trim(),ingredients:$("recipe-ingredients").value.trim(),steps:$("recipe-steps").value.trim(),image_url:publicUrl,image_path:path});
 $("recipe-submit").disabled=false;
 if(error){message("recipe-message","บันทึกสูตรไม่สำเร็จ: "+error.message);return;}
 $("recipe-form").reset();$("post-dialog").close();await loadRecipes();$("notice").textContent="เผยแพร่สูตรของคุณแล้ว!";$("notice").classList.remove("hidden");
});
$("search").addEventListener("input",renderRecipes);
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{sortMode=t.dataset.sort;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===t));renderRecipes();});
if(db){db.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;updateAccount();});}
(async()=>{if(ready){await syncSession();await loadRecipes();}else loadRecipes();})();
