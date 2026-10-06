import{o as e}from"./rolldown-runtime-C0FnF6B9.js";import{S as t,x as n}from"./index-3Jq4pmb9.js";import{s as r,t as i}from"./AppShell-BmM6kb5z.js";import{t as a}from"./sparkles-DfbL-7FV.js";import{t as o}from"./gemini-CeSqsLaT.js";var s={name:`send`,size:24,node:[[`path`,{d:`M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z`,key:`1ffxy3`}],[`path`,{d:`m21.854 2.147-10.94 10.939`,key:`12cjpa`}]]};s.node;var c=r(s),l=e(t()),u=n(),d=120;function m(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/^\s*[-*]\s+/gm,"• ").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\n/g,"<br>")}function f(){let[e,t]=(0,l.useState)([]),[n,r]=(0,l.useState)(""),s=(0,l.useRef)(null);(0,l.useEffect)(()=>{s.current?.scrollTo({top:s.current.scrollHeight,behavior:"smooth"})},[e]);async function f(){let i=n.trim();if(!i)return;let a=e.filter(e=>!e.temp).slice(-10).map(e=>`${e.sender==="user"?"User":"Clarivana"}: ${e.text}`).join("\n");r(""),t(e=>[...e,{text:i,sender:"user"},{text:"Thinking...",sender:"bot",temp:!0}]);let s;try{s=await o(`You are Clarivana AI, a friendly food and ingredient assistant.

Your job is to help normal people understand food ingredients, additives, nutrition, and food products.

IMPORTANT RULES:

1. ALWAYS use the conversation history to understand context.
2. Words such as "it", "this", "that", "they", "the ingredient", "the product", and "the alternative" refer to the previous conversation when appropriate.
3. If the conversation is about food or ingredients, NEVER interpret "IT" as Information Technology.
4. Stay in the food and nutrition context unless the user clearly changes the subject.
5. Use very simple everyday English that anyone can understand.
6. Start with the direct answer.
7. Explain technical terms in simple words.
8. Keep answers concise but useful.
9. Use short paragraphs and bullet points when useful.
10. If the user asks for alternatives, give 2-4 practical alternatives and explain each in one short sentence.
11. Explain WHY something is used, not only WHAT it is.
12. Do not overwhelm the user with scientific or chemical details.
13. Do not make unsupported claims that an ingredient is dangerous or harmful.
14. If something depends on allergies, dietary restrictions, age, or personal preferences, say so clearly.
15. For allergy-related questions, remind the user to verify the actual product label.
16. Do not repeat the user's question.
17. Use bold text for important words when helpful.
18. End with a simple "Bottom line:" when useful.
19. Do not sound like a textbook, research paper, or medical journal.
20. Answer in under ${d} words.

CONVERSATION HISTORY:
${a||"No previous conversation."}

CURRENT USER QUESTION:
${i}`)||"Sorry, I couldn't process that."}catch(e){console.error(e),s="⚠️ I couldn't connect to Clarivana AI. Please try again."}t(e=>[...e.filter(e=>!e.temp),{text:s,sender:"bot"}])}return(0,u.jsx)(i,{children:(0,u.jsxs)("div",{className:"fade-up mx-auto flex max-w-3xl flex-col",children:[(0,u.jsx)("p",{className:"eyebrow",children:"Clarivana AI"}),(0,u.jsx)("h1",{className:"mt-2 text-3xl font-semibold tracking-tight",children:"Assistant"}),(0,u.jsx)("p",{className:"mt-1.5 text-sm text-muted-foreground",children:"Ask anything about ingredients, additives or nutrition."}),(0,u.jsxs)("div",{ref:s,className:"panel mt-6 h-[55vh] space-y-3 overflow-y-auto p-5",children:[e.length===0&&(0,u.jsxs)("div",{className:"flex h-full flex-col items-center justify-center text-center text-muted-foreground",children:[(0,u.jsx)(a,{className:"h-6 w-6 text-primary",strokeWidth:1.5}),(0,u.jsx)("p",{className:"mt-3 text-sm",children:"Try “Is E621 safe for kids?”"})]}),e.map((e,t)=>(0,u.jsx)("div",{className:e.sender==="user"?"flex justify-end":"flex justify-start",children:(0,u.jsx)("div",{className:e.sender==="user"?"max-w-[80%] rounded-xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground":"max-w-[80%] whitespace-pre-wrap rounded-xl rounded-bl-sm border border-border bg-card-raised px-4 py-2.5 text-sm ".concat(e.temp?"animate-pulse text-muted-foreground":""),children:e.sender==="bot"?(0,u.jsx)("span",{dangerouslySetInnerHTML:{__html:m(e.text)}}):e.text})},t))]}),(0,u.jsxs)("div",{className:"mt-3 flex gap-2",children:[(0,u.jsx)("input",{className:"field flex-1",placeholder:"Ask a question…",value:n,onChange:e=>r(e.target.value),onKeyDown:e=>e.key==="Enter"&&f()}),(0,u.jsx)("button",{onClick:f,className:"btn-base btn-primary px-4","aria-label":"Send",children:(0,u.jsx)(c,{className:"h-4 w-4"})})]})]})})}export{f as component};
