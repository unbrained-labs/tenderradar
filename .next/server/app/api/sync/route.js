"use strict";(()=>{var e={};e.id=475,e.ids=[475],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},7539:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.r(t),r.d(t,{originalPathname:()=>h,patchFetch:()=>d,requestAsyncStorage:()=>p,routeModule:()=>l,serverHooks:()=>f,staticGenerationAsyncStorage:()=>u});var a=r(1569),n=r(5482),i=r(7807),o=r(9243),c=e([o]);o=(c.then?(await c)():c)[0];let l=new a.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/sync/route",pathname:"/api/sync",filename:"route",bundlePath:"app/api/sync/route"},resolvedPagePath:"/Users/dd/repos/locallab/rfp-finder/app/api/sync/route.ts",nextConfigOutput:"standalone",userland:o}),{requestAsyncStorage:p,staticGenerationAsyncStorage:u,serverHooks:f}=l,h="/api/sync/route";function d(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:u})}s()}catch(e){s(e)}})},9243:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.r(t),r.d(t,{GET:()=>d,POST:()=>c,maxDuration:()=>l});var a=r(314),n=r(8209),i=r(6585),o=e([n]);n=(o.then?(await o)():o)[0];let l=60;async function c(e){let t=e.headers.get("x-cron-secret");if(process.env.CRON_SECRET&&t!==process.env.CRON_SECRET)return a.NextResponse.json({error:"Unauthorized"},{status:401});let[{id:r}]=await (0,n.i)`
    INSERT INTO sync_log (source, status)
    VALUES ('simap.ch', 'running')
    RETURNING id
  `;try{let e=await (0,i.Mu)({maxPages:10,pageSize:20,delayMs:200}),t=0;for(let r of e)await (0,n.i)`
        INSERT INTO tenders (
          source_id, title, description, issuer_name, issuer_canton,
          cpv_codes, posted_date, response_deadline,
          estimated_value_min, estimated_value_max, currency,
          status, source_url, attachments, contacts, raw
        ) VALUES (
          ${r.source_id},
          ${r.title},
          ${r.description},
          ${r.issuer_name},
          ${r.issuer_canton},
          ${JSON.stringify(r.cpv_codes)},
          ${r.posted_date},
          ${r.response_deadline},
          ${r.estimated_value_min},
          ${r.estimated_value_max},
          ${r.currency},
          ${r.status},
          ${r.source_url},
          ${JSON.stringify(r.attachments)},
          ${JSON.stringify(r.contacts)},
          ${JSON.stringify(r.raw)}
        )
        ON CONFLICT (source_id) DO UPDATE SET
          title              = EXCLUDED.title,
          description        = EXCLUDED.description,
          issuer_name        = EXCLUDED.issuer_name,
          issuer_canton      = EXCLUDED.issuer_canton,
          cpv_codes          = EXCLUDED.cpv_codes,
          response_deadline  = EXCLUDED.response_deadline,
          status             = EXCLUDED.status,
          attachments        = EXCLUDED.attachments,
          contacts           = EXCLUDED.contacts,
          raw                = EXCLUDED.raw,
          updated_at         = NOW()
      `,t++;return await (0,n.i)`
      UPDATE tenders
      SET status = 'expired'
      WHERE status = 'active'
        AND response_deadline IS NOT NULL
        AND response_deadline < NOW() - INTERVAL '1 day'
    `,await (0,n.i)`
      UPDATE sync_log
      SET status = 'success',
          finished_at = NOW(),
          records_fetched = ${e.length},
          records_upserted = ${t}
      WHERE id = ${r}
    `,a.NextResponse.json({ok:!0,fetched:e.length,upserted:t})}catch(t){let e=t instanceof Error?t.message:String(t);return await (0,n.i)`
      UPDATE sync_log
      SET status = 'error', finished_at = NOW(), error = ${e}
      WHERE id = ${r}
    `,console.error("Sync error:",e),a.NextResponse.json({error:e},{status:500})}}async function d(e){return c(e)}s()}catch(e){s(e)}})},8209:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.d(t,{i:()=>d,l:()=>o});var a=r(8048),n=e([a]);a=(n.then?(await n)():n)[0];let c=null;function i(){if(c)return c;if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is required. Copy .env.example to .env.local");return c=(0,a.neon)(process.env.DATABASE_URL)}let d=new Proxy({},{apply:(e,t,r)=>i()(...r),get:(e,t)=>i()[t]});async function o(e,t=[]){return await d(e,t)}s()}catch(e){s(e)}})},6585:(e,t,r)=>{r.d(t,{Mu:()=>c});let s=process.env.SIMAP_BASE_URL??"https://www.simap.ch/api";function a(){return{Accept:"application/json","User-Agent":"TenderRadar/0.1"}}async function n(e){let t=new URLSearchParams;t.set("size",String(e.size??50)),t.set("page",String(e.page??0)),e.search&&t.set("search",e.search),e.cantons&&e.cantons.length>0&&e.cantons.forEach(e=>t.append("orderAddressCantons",e)),e.cpvPrefix&&t.set("cpcCodes",e.cpvPrefix);let r=`${s}/publications/v2/project/project-search?${t}`,n=await fetch(r,{headers:a(),cache:"no-store"});if(!n.ok)throw Error(`simap search error ${n.status}: ${await n.text()}`);let i=await n.json();return!1!==e.activeOnly&&(i.projects=i.projects.filter(e=>"tender"===e.pubType||"participant_selection"===e.pubType)),i}async function i(e,t){let r=`${s}/publications/v1/project/${e}/publication-details/${t}`,n=await fetch(r,{headers:a(),cache:"no-store"});if(!n.ok)throw Error(`simap detail error ${n.status} for ${e}/${t}`);return n.json()}function o(e){return e?e.de??e.fr??e.it??e.en??null:null}async function c(e){let{maxPages:t=20,pageSize:r=50,delayMs:s=300}=e,a=[],c=0,d=0;for(;c<t;){let t=(await n({search:e.search??"",cantons:e.cantons,page:c,size:r,activeOnly:!0})).projects;if(0===t.length)break;d+=t.length;for(let e=0;e<t.length;e+=5){let r=t.slice(e,e+5);(await Promise.allSettled(r.map(e=>i(e.id,e.publicationId)))).forEach((e,t)=>{if("fulfilled"===e.status)try{a.push(function(e,t){let r=t["project-info"],s=t.procurement,a=t.dates,n=o(r.title)??o(e.title)??"Untitled",i=o(s.orderDescription),c=o(r.procOfficeAddress.name)??o(e.procOfficeName)??"Unknown",d=s.orderAddress?.cantonId??r.procOfficeAddress.cantonId??e.orderAddress?.cantonId??null,l=[];s.cpvCode?.code&&l.push(s.cpvCode.code),s.additionalCpvCodes.forEach(e=>l.push(e.code));let p=[],u=o(r.procOfficeAddress.contactPerson);(u||r.procOfficeAddress.email)&&p.push({name:u??c,email:r.procOfficeAddress.email??void 0,phone:r.procOfficeAddress.phone??void 0,role:"Procurement Contact"});let f="active";"award"===e.pubType&&(f="awarded");let h=`https://www.simap.ch/en/home/tenders/tender-detail.html?projectId=${e.id}&publicationId=${e.publicationId}`,m=t.hasProjectDocuments?[{name:"Tender Documents (simap.ch)",url:h,size_bytes:void 0}]:[];return{source_id:`simap-${e.publicationId}`,title:n.trim(),description:i?i.replace(/<[^>]+>/g," ").trim():null,issuer_name:c,issuer_canton:d?.toUpperCase().slice(0,2)??null,cpv_codes:l,posted_date:a.publicationDate??e.publicationDate??null,response_deadline:a.offerDeadline??null,estimated_value_min:null,estimated_value_max:null,currency:"CHF",status:f,source_url:h,attachments:m,contacts:p,raw:{project:e,detail:t}}}(r[t],e.value))}catch(e){console.warn(`Normalize error for ${r[t].id}:`,e)}else console.warn(`Detail fetch failed for ${r[t].id}:`,e.reason)}),s>0&&await new Promise(e=>setTimeout(e,s))}if(t.length<r)break;c++}return console.log(`simap sync: fetched ${d} projects, normalized ${a.length}`),a}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[33,514],()=>r(7539));module.exports=s})();