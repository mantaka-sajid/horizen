"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Camera, Compass, Heart, MessageCircle, Plus, Search, Sun, Moon, Leaf, LogIn, LogOut, ShieldCheck, X, Image as ImageIcon, Menu, UserRound, Sparkles } from "lucide-react";

type Post = {
  id: string; user_id: string; image_url: string; caption: string | null;
  location: string | null; category: string; created_at: string;
  profiles?: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
  likes?: { user_id: string }[];
  comments?: { id: string; body: string; user_id: string; created_at: string }[];
};
type Profile = { id: string; username: string | null; display_name: string | null; bio: string | null; role: string };

const demoPosts: Post[] = [
  {id:"demo-1",user_id:"nature",image_url:"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200",caption:"A quiet morning where the mountains meet the clouds. Sometimes the best thing we can do is pause and notice.",location:"Swiss Alps",category:"Landscape",created_at:new Date().toISOString(),profiles:{username:"wild.frames",display_name:"Wild Frames",avatar_url:null},likes:[{user_id:"a"},{user_id:"b"},{user_id:"c"}],comments:[]},
  {id:"demo-2",user_id:"nature",image_url:"https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1200",caption:"A little reminder that the wild has its own quiet rhythm. Captured from a respectful distance.",location:"Forest trail",category:"Wildlife",created_at:new Date().toISOString(),profiles:{username:"earth.notes",display_name:"Earth Notes",avatar_url:null},likes:[{user_id:"a"},{user_id:"b"}],comments:[]},
  {id:"demo-3",user_id:"nature",image_url:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200",caption:"Green paths, soft light, and nowhere else I need to be.",location:"Woodland",category:"Nature",created_at:new Date().toISOString(),profiles:{username:"lens.and.leaf",display_name:"Lens & Leaf",avatar_url:null},likes:[{user_id:"a"},{user_id:"b"},{user_id:"c"},{user_id:"d"}],comments:[]},
  {id:"demo-4",user_id:"nature",image_url:"https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=1200",caption:"Small details. Entire worlds. Look closely.",location:"Garden",category:"Macro",created_at:new Date().toISOString(),profiles:{username:"little.wonders",display_name:"Little Wonders",avatar_url:null},likes:[{user_id:"a"}],comments:[]},
  {id:"demo-5",user_id:"nature",image_url:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",caption:"Chasing the last light of the day.",location:"Open country",category:"Landscape",created_at:new Date().toISOString(),profiles:{username:"golden.hour",display_name:"Golden Hour",avatar_url:null},likes:[{user_id:"a"},{user_id:"b"}],comments:[]},
  {id:"demo-6",user_id:"nature",image_url:"https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1200",caption:"A small moment of calm, saved for a day that needs it.",location:"By the water",category:"Nature",created_at:new Date().toISOString(),profiles:{username:"slow.moments",display_name:"Slow Moments",avatar_url:null},likes:[{user_id:"a"},{user_id:"b"},{user_id:"c"}],comments:[]}
];

const categories = ["All","Nature","Wildlife","Birds","Landscape","Macro","Flowers","Sky & Weather","Water"];
const img = (url:string) => ({backgroundImage:`url("${url}")`});

export default function Home() {
  const [dark,setDark] = useState(true);
  const [tab,setTab] = useState("Discover");
  const [posts,setPosts] = useState<Post[]>(demoPosts);
  const [user,setUser] = useState<any>(null);
  const [profile,setProfile] = useState<Profile|null>(null);
  const [filter,setFilter] = useState("All");
  const [search,setSearch] = useState("");
  const [authOpen,setAuthOpen] = useState(false);
  const [uploadOpen,setUploadOpen] = useState(false);
  const [storyOpen,setStoryOpen] = useState(false);
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [displayName,setDisplayName] = useState("");
  const [authMode,setAuthMode] = useState<"in"|"up">("up");
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");
  const [caption,setCaption] = useState("");
  const [location,setLocation] = useState("");
  const [category,setCategory] = useState("Nature");
  const [uploadFile,setUploadFile] = useState<File|null>(null);
  const [activePost,setActivePost] = useState<Post|null>(null);
  const [comment,setComment] = useState("");
  const [storyTitle,setStoryTitle] = useState("");
  const [storyBody,setStoryBody] = useState("");
  const [stories,setStories] = useState<any[]>([]);\n  const [reports,setReports] = useState<any[]>([]);\n  const [reportReason,setReportReason] = useState("Inappropriate or harmful content");

  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; },[dark]);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => setUser(data.session?.user ?? null));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  },[]);
  useEffect(() => { if (user) { loadProfile(user.id); loadPosts(); loadStories(); } },[user]);
  async function loadProfile(id:string) {
    if (!supabase) return;
    const {data} = await supabase.from("profiles").select("*").eq("id",id).maybeSingle();
    if (data) setProfile(data as Profile);
  }
  async function loadPosts() {
    if (!supabase) return;
    const {data,error} = await supabase.from("posts").select("*, profiles(username,display_name,avatar_url), likes(user_id), comments(id,body,user_id,created_at)").order("created_at",{ascending:false}).limit(60);
    if (!error && data) setPosts(data as Post[]);
  }
  async function loadStories() {
    if (!supabase) return;
    const {data} = await supabase.from("stories").select("*, profiles(username,display_name)").order("created_at",{ascending:false}).limit(30);
    if (data) setStories(data);
  }
  async function signIn(e:React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setNotice("");
    const result = authMode === "in"
      ? await supabase.auth.signInWithPassword({email,password})
      : await supabase.auth.signUp({email,password,options:{data:{display_name:displayName}}});
    setBusy(false);
    if (result.error) setNotice(result.error.message);
    else { setNotice(authMode==="up" ? "Account created. Check your email if confirmation is enabled." : "Welcome back."); if (authMode==="in") setAuthOpen(false); }
  }
  async function signOut() { if (supabase) await supabase.auth.signOut(); setUser(null); setTab("Discover"); }
  async function publishPost(e:React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user || !uploadFile) return;
    setBusy(true); setNotice("");
    const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g,"-");
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const {error:storageError} = await supabase.storage.from("photos").upload(path,uploadFile,{upsert:false});
    if (storageError) { setNotice(storageError.message); setBusy(false); return; }
    const {data:publicData} = supabase.storage.from("photos").getPublicUrl(path);
    const {error} = await supabase.from("posts").insert({user_id:user.id,image_url:publicData.publicUrl,caption,location,category});
    setBusy(false);
    if (error) setNotice(error.message);
    else { setUploadOpen(false); setCaption(""); setLocation(""); setUploadFile(null); await loadPosts(); setNotice("Your photograph is now part of Horizen."); }
  }
  async function toggleLike(post:Post) {
    if (!supabase || !user) { setAuthOpen(true); return; }
    const liked = post.likes?.some(l=>l.user_id===user.id);
    if (liked) await supabase.from("likes").delete().eq("post_id",post.id).eq("user_id",user.id);
    else await supabase.from("likes").insert({post_id:post.id,user_id:user.id});
    await loadPosts();
  }
  async function addComment(e:React.FormEvent) {
    e.preventDefault(); if (!supabase || !user || !activePost || !comment.trim()) return;
    const {error} = await supabase.from("comments").insert({post_id:activePost.id,user_id:user.id,body:comment.trim()});
    if (error) setNotice(error.message); else {setComment(""); await loadPosts(); const fresh = posts.find(p=>p.id===activePost.id); if (fresh) setActivePost(fresh);}
  }
  async function publishStory(e:React.FormEvent) {
    e.preventDefault(); if (!supabase || !user) return;
    const {error} = await supabase.from("stories").insert({user_id:user.id,title:storyTitle,body:storyBody});
    if (error) setNotice(error.message); else {setStoryOpen(false);setStoryTitle("");setStoryBody("");await loadStories();}
  }
  const visiblePosts = useMemo(()=>posts.filter(p=>(filter==="All"||p.category===filter)&&(`${p.caption??""} ${p.location??""} ${p.category} ${p.profiles?.display_name??""}`).toLowerCase().includes(search.toLowerCase())),[posts,filter,search]);
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";\n  useEffect(() => { if (isAdmin) loadReports(); },[isAdmin]);

  return <main className="site-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark"><Leaf size={19}/></span><span>horizen<span className="brand-dot">.</span><small>SEE NATURE. SHARE MOMENTS.</small></span></a>
      <nav className="desktop-nav">
        {["Discover","Stories","Community",...(isAdmin?["Admin"]:[])].map(item=><button key={item} className={tab===item?"nav-link active":"nav-link"} onClick={()=>setTab(item)}>{item}</button>)}
      </nav>
      <div className="top-actions">
        <button className="icon-button" aria-label="Toggle theme" onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
        {user ? <><button className="profile-pill" onClick={()=>setTab("Profile")}><UserRound size={16}/><span>{profile?.display_name || user.email?.split("@")[0]}</span></button><button className="icon-button" aria-label="Sign out" onClick={signOut}><LogOut size={18}/></button></> : <button className="sign-in" onClick={()=>{setAuthMode("up");setAuthOpen(true)}}><LogIn size={16}/> Join Horizen</button>}
      </div>
    </header>

    <section className="hero">
      <div className="hero-image"></div><div className="hero-shade"></div>
      <div className="hero-content">
        <div className="eyebrow"><span></span> A COMMUNITY THROUGH THE LENS</div>
        <h1>Find your calm.<br/><em>Frame your world.</em></h1>
        <p>For the moments that make you stop, look closer, and feel a little more alive. Share what you see. Inspire someone else.</p>
        <div className="hero-buttons"><button className="primary-button" onClick={()=>document.getElementById("gallery")?.scrollIntoView({behavior:"smooth"})}>Explore the gallery <Compass size={17}/></button><button className="ghost-button" onClick={()=>{if(user)setUploadOpen(true);else setAuthOpen(true)}}><Camera size={17}/> Share your first shot</button></div>
        <div className="hero-note"><span className="avatar-stack"><i>✦</i><i>◌</i><i>⌁</i></span><span>A place for every eye, every lens, every story.</span></div>
      </div>
      <div className="hero-caption"><span>01 / THE NATURAL WORLD</span><span>TAKE A MOMENT TO LOOK</span></div>
    </section>

    <section className="intro-row"><div><span className="section-kicker">A LITTLE SPACE TO BREATHE</span><h2>Nature looks different<br/>through <em>every lens.</em></h2></div><p>Not a competition. Not a gear showcase. Just a thoughtful corner of the internet where a phone photo can inspire as much as a professional frame.</p></section>

    {notice && <div className="notice" role="status">{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
    {!isSupabaseConfigured && <div className="setup-banner"><Sparkles size={17}/><span><b>Preview mode:</b> the gallery is ready to explore. Connect a free Supabase project to enable real accounts, uploads, likes, comments and stories.</span></div>}

    <section className="gallery-section" id="gallery">
      <div className="section-heading"><div><span className="section-kicker">THE COMMUNITY GALLERY</span><h2>Fresh from the <em>wild.</em></h2></div><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a moment..."/></div></div>
      <div className="filters">{categories.map(c=><button key={c} onClick={()=>setFilter(c)} className={filter===c?"filter active":"filter"}>{c}</button>)}</div>
      <div className="photo-grid">{visiblePosts.map((p,i)=><article className={`photo-card card-${i%3}`} key={p.id}>
        <button className="photo-open" onClick={()=>setActivePost(p)} aria-label="Open photograph"><img src={p.image_url} alt={p.caption||"Community nature photograph"}/><span className="photo-overlay"><span>{p.category}</span><b>{p.location||"A moment in nature"}</b></span></button>
        <div className="photo-meta"><div className="creator"><span className="mini-avatar">{(p.profiles?.display_name||"H").slice(0,1).toUpperCase()}</span><span><b>{p.profiles?.display_name||"Horizen member"}</b><small>@{p.profiles?.username||"community"}</small></span></div><div className="engagement"><button onClick={()=>toggleLike(p)} aria-label="Like photograph" className={p.likes?.some(l=>l.user_id===user?.id)?"liked":""}><Heart size={17} fill={p.likes?.some(l=>l.user_id===user?.id)?"currentColor":"none"}/>{p.likes?.length||0}</button><button onClick={()=>setActivePost(p)} aria-label="View comments"><MessageCircle size={17}/>{p.comments?.length||0}</button></div></div>
        {p.caption&&<p className="card-caption">{p.caption}</p>}
      </article>)}</div>
      {visiblePosts.length===0&&<div className="empty-state">No photographs found in this collection yet.</div>}
    </section>

    <section className="manifesto"><div className="manifesto-image"></div><div className="manifesto-copy"><span className="section-kicker">THE HORIZEN WAY</span><h2>It’s not about the camera.<br/><em>It’s about what you notice.</em></h2><p>Every skill level belongs here. Every honest perspective matters. Share the small things, the wild things, the places that helped you breathe again.</p><button className="text-button" onClick={()=>setTab("Community")}>Meet the community <span>↗</span></button></div></section>

    {tab==="Stories" && <section className="stories-section"><div className="section-heading"><div><span className="section-kicker">BEHIND THE FRAME</span><h2>Stories worth <em>sharing.</em></h2></div>{user&&<button className="primary-button" onClick={()=>setStoryOpen(true)}><Plus size={17}/> Write a story</button>}</div>{stories.length?stories.map(s=><article className="story-card" key={s.id}><span className="section-kicker">{s.profiles?.display_name||"A community member"}</span><h3>{s.title}</h3><p>{s.body}</p></article>):<div className="empty-state">The first stories are waiting to be written. Sign in and share what happened behind your frame.</div>}</section>}
    {tab==="Community" && <section className="community-panel"><span className="section-kicker">BETTER TOGETHER</span><h2>A thousand perspectives.<br/><em>One shared world.</em></h2><p>Join the community, follow your curiosity and encourage the people behind the photographs.</p><button className="primary-button" onClick={()=>user?setTab("Profile"):(setAuthMode("up"),setAuthOpen(true))}>{user?"View your profile":"Create your free account"} <Plus size={17}/></button></section>}
    {tab==="Profile" && <section className="community-panel"><span className="section-kicker">YOUR CORNER OF HORIZEN</span><h2>{profile?.display_name||user?.email?.split("@")[0]||"Your profile"}</h2><p>{profile?.bio||"Your photography story starts here."}</p><button className="primary-button" onClick={()=>setUploadOpen(true)}><Plus size={17}/> Share a photograph</button>{isAdmin&&<div className="admin-note"><ShieldCheck size={18}/> Admin / moderator access enabled. Review reports and member roles in Supabase.</div>}</section>}

    {tab==="Admin" && isAdmin && <section className="stories-section admin-section">
      <div className="section-heading"><div><span className="section-kicker">HORIZEN CONTROL ROOM</span><h2>Community <em>moderation.</em></h2></div><button className="ghost-button admin-refresh" onClick={loadReports}>Refresh reports</button></div>
      <div className="admin-stats">
        <div><b>{reports.filter(r=>r.status==="open").length}</b><span>Open reports</span></div>
        <div><b>{reports.filter(r=>r.status==="reviewed").length}</b><span>Reviewed</span></div>
        <div><b>{posts.length}</b><span>Loaded posts</span></div>
      </div>
      <h3 className="admin-subhead">Reported content</h3>
      {!reports.length ? <div className="empty-state">No reports to review. The moderation queue is clear.</div> : reports.map(r=><article className="report-card" key={r.id}>
        <div className="report-info"><span className={"report-status "+r.status}>{r.status}</span><b>{r.posts?.caption||r.comments?.body||"Reported content"}</b><small>Reason: {r.reason} · {new Date(r.created_at).toLocaleString()}</small></div>
        {r.posts?.image_url&&<img src={r.posts.image_url} alt="Reported post"/>}
        <div className="report-actions">
          {r.posts?.id&&<button className="danger-button" onClick={()=>removePost(r.posts.id)}>Remove post</button>}
          {r.status==="open"&&<><button className="small-action" onClick={()=>resolveReport(r.id,"reviewed")}>Mark reviewed</button><button className="small-action" onClick={()=>resolveReport(r.id,"dismissed")}>Dismiss</button></>}
        </div>
      </article>)}
      <div className="admin-guidance"><ShieldCheck size={18}/><p><b>Moderator responsibilities</b><br/>Review reports fairly, remove harmful or infringing content, and protect members’ privacy. Role changes and account bans should be handled through trusted Supabase administration until the full member-management console is added.</p></div>
    </section>}

    <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><Leaf size={18}/></span><span>horizen<span className="brand-dot">.</span><small>SEE NATURE. SHARE MOMENTS.</small></span></a><p>For every eye. For every lens. For the love of the natural world.</p><span>© {new Date().getFullYear()} Horizen Community</span></footer>

    {authOpen&&<div className="modal-backdrop" onClick={()=>setAuthOpen(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setAuthOpen(false)}><X/></button><span className="section-kicker">WELCOME TO HORIZEN</span><h2>{authMode==="up"?"Make room for wonder.":"Good to see you again."}</h2><p className="modal-sub">A free account lets you share photographs, stories and encouragement.</p><form onSubmit={signIn}>{authMode==="up"&&<input required value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your display name"/>}<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address"/><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (at least 8 characters)"/><button className="primary-button full" disabled={busy}>{busy?"Please wait...":authMode==="up"?"Create free account":"Sign in"}</button></form><button className="switch-auth" onClick={()=>setAuthMode(authMode==="up"?"in":"up")}>{authMode==="up"?"Already a member? Sign in":"New to Horizen? Create an account"}</button></div></div>}
    {uploadOpen&&<div className="modal-backdrop" onClick={()=>setUploadOpen(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setUploadOpen(false)}><X/></button><span className="section-kicker">SHARE YOUR PERSPECTIVE</span><h2>One frame. Your story.</h2><form onSubmit={publishPost}><label className="upload-drop"><ImageIcon size={28}/><b>{uploadFile?uploadFile.name:"Choose a photograph"}</b><small>JPG, PNG or WebP · Keep uploads respectful and original</small><input required type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setUploadFile(e.target.files?.[0]||null)}/></label><textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Tell us what makes this moment special..." rows={3}/><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location (optional)"/><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select><button className="primary-button full" disabled={busy||!user||!isSupabaseConfigured}>{busy?"Sharing...":"Publish photograph"}</button></form></div></div>}
    {storyOpen&&<div className="modal-backdrop" onClick={()=>setStoryOpen(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setStoryOpen(false)}><X/></button><span className="section-kicker">BEHIND THE LENS</span><h2>Tell the story.</h2><form onSubmit={publishStory}><input required value={storyTitle} onChange={e=>setStoryTitle(e.target.value)} placeholder="Story title"/><textarea required rows={7} value={storyBody} onChange={e=>setStoryBody(e.target.value)} placeholder="What happened before, during or after you captured this moment?"/><button className="primary-button full">Publish story</button></form></div></div>}
    {activePost&&<div className="modal-backdrop" onClick={()=>setActivePost(null)}><div className="post-modal" onClick={e=>e.stopPropagation()}><button className="modal-close light-close" onClick={()=>setActivePost(null)}><X/></button><img src={activePost.image_url} alt={activePost.caption||"Nature photograph"}/><div className="post-detail"><span className="section-kicker">{activePost.category} · {activePost.location||"Nature"}</span><p>{activePost.caption}</p><div className="report-inline"><select value={reportReason} onChange={e=>setReportReason(e.target.value)}><option>Inappropriate or harmful content</option><option>Copyright or ownership concern</option><option>Spam or misleading content</option><option>Privacy or location concern</option><option>Other community guideline concern</option></select><button className="small-action" onClick={()=>submitReport(activePost)}>Report</button></div><div className="comment-list">{(activePost.comments||[]).map(c=><p key={c.id}><b>Community member</b> {c.body}</p>)}</div>{user&&supabase&&<form className="comment-form" onSubmit={addComment}><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Leave a thoughtful comment..."/><button className="primary-button">Send</button></form>}{!user&&<button className="text-button" onClick={()=>{setActivePost(null);setAuthOpen(true)}}>Sign in to join the conversation ↗</button>}</div></div></div>}
  </main>;
}
