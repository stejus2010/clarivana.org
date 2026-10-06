import{a as e,m as t,r as n,u as r}from"./index-3Jq4pmb9.js";import{s as i}from"./AppShell-BmM6kb5z.js";import{t as a}from"./swal-Co_5j0q9.js";var o={name:`check`,size:24,node:[[`path`,{d:`M20 6 9 17l-5-5`,key:`1gmf2c`}]]};o.node;var s=i(o),c={name:`shield-check`,size:24,node:[[`path`,{d:`M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`,key:`oel41y`}],[`path`,{d:`m9 12 2 2 4-4`,key:`dzmm74`}]]};c.node;var l=i(c),u=`$2.99`;async function d(){let r=n(),i=r?.auth.currentUser;return!r||!i?`free`:(await e(t(r.db,`users`,i.uid))).data()?.plan===`premium`?`premium`:`free`}async function f(){let e=n(),i=e?.auth.currentUser;if(!e||!i)return await a.fire({icon:`info`,title:`Log in first`,text:`Please log in before upgrading your plan.`}),!1;if(!(await a.fire({title:`Start Clarivana Premium`,html:`
      <div class="cv-checkout">
        <div class="cv-checkout-plan">
          <div>
            <p class="cv-results-title">Premium monthly</p>
            <p class="cv-checkout-price">$2.99<span>/month</span></p>
          </div>
          <span class="cv-premium-mark">PRO</span>
        </div>
        <div class="cv-checkout-benefits">
          <span>✓ Unlimited food-label scans</span>
          <span>✓ Unlimited AI ingredient analysis</span>
          <span>✓ Deeper health insights and alternatives</span>
        </div>
        <div class="cv-demo-payment">
          <span class="cv-demo-card">•••• 4242</span>
          <span>Competition demo card</span>
        </div>
        <p class="cv-demo-notice"><b>Demo only.</b> No real payment is processed and no card details are collected.</p>
      </div>`,width:520,showCancelButton:!0,confirmButtonText:`Start Premium — $2.99`,cancelButtonText:`Not now`,buttonsStyling:!1,customClass:{popup:`clarivana-modal`,confirmButton:`cv-swal-btn cv-swal-primary`,cancelButton:`cv-swal-btn cv-swal-outline`},focusConfirm:!1})).isConfirmed)return!1;a.fire({title:`Activating Premium…`,text:`Setting up your competition demo subscription.`,allowOutsideClick:!1,showConfirmButton:!1,didOpen:()=>a.showLoading()});let o=new Date,s=new Date(o);return s.setMonth(s.getMonth()+1),await r(t(e.db,`users`,i.uid),{plan:`premium`,premiumSince:o.toISOString(),billing:{demo:!0,interval:`month`,price:2.99,currency:`USD`,renewsAt:s.toISOString()}},{merge:!0}),await a.fire({icon:`success`,title:`Welcome to Premium`,text:`Unlimited scans and AI analysis are now active for this demo.`,confirmButtonText:`Continue`,buttonsStyling:!1,customClass:{confirmButton:`cv-swal-btn cv-swal-primary`}}),!0}async function p(){let e=n(),i=e?.auth.currentUser;return!e||!i||!(await a.fire({icon:`warning`,title:`End demo subscription?`,text:`Your account will return to the Free plan and daily limits will apply.`,showCancelButton:!0,confirmButtonText:`Return to Free`,cancelButtonText:`Keep Premium`,buttonsStyling:!1,customClass:{confirmButton:`cv-swal-btn cv-swal-outline`,cancelButton:`cv-swal-btn cv-swal-primary`}})).isConfirmed?!1:(await r(t(e.db,`users`,i.uid),{plan:`free`,premiumEndedAt:new Date().toISOString(),billing:{demo:!0,status:`cancelled`}},{merge:!0}),!0)}export{l as a,f as i,p as n,s as o,d as r,u as t};