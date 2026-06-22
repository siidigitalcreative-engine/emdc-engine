Replace this file:
app/page.tsx

Commit message:
Improve ecommerce prompt references and selectable output structure

What to change
1) Replace the current two-step catalog image flow (Choose Images + Add Reference) with one button only:
   - "Upload Reference Images"
   - It must support multiple image uploads at once.
   - Pasted catalog images should also go directly into the same uploaded reference list.
   - Remove the separate "pendingPromptImages" flow and remove the "Add Reference" button.

2) Make "Required Output Structure" selectable.
   - Each item should be a checkbox / selectable chip.
   - Only selected items should be included in the generated prompt.
   - Default all items to selected.
   - If user deselects everything, fallback to all sections during generation.

3) Keep uploaded reference images as extra visual references only.
   - The prompt still comes either from:
     a) Use Listing Template
     b) Manually written prompt
   - Uploaded reference images are attached and used by Gemini as visual reference.

======================================================================
A. ADD THESE HELPERS INSIDE THE CHECKLIST GROUP PAGE COMPONENT
======================================================================

1) Add this helper near the other helpers inside the checklist group page component:

const getDefaultEcommerceSections = () => [...ecommerceOutputSections];

const getSelectedEcommerceSections = () => {
  const data = ((group.aiWorkspace || {}).ecommerce || {}) as any;
  const selected = Array.isArray(data.selectedSections) ? data.selectedSections.filter(Boolean) : [];
  return selected.length ? selected : getDefaultEcommerceSections();
};

const toggleEcommerceSection = (section:string) => {
  const current = getSelectedEcommerceSections();
  const exists = current.includes(section);
  const next = exists ? current.filter((s:string)=>s!==section) : [...current, section];
  updateAiWorkspace("ecommerce", { selectedSections: next });
};

const addCatalogFilesDirectly = async (tab:string, filesInput:any) => {
  const incoming = Array.from(filesInput || []).filter((f:any)=>String(f?.type||"").startsWith("image/"));
  if(!incoming.length) return;
  const converted = await Promise.all(
    incoming.map((file:any)=>new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: uid(),
        name: file.name || `reference-${uid()}.png`,
        type: file.type || "image/png",
        size: file.size || 0,
        dataUrl: String(reader.result || ""),
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }))
  );
  const existing = ((((group.aiWorkspace || {})[tab] || {}) as any).catalogFiles || []) as any[];
  updateAiWorkspace(tab, { catalogFiles: [...existing, ...converted] });
};

2) Update the current paste handler so pasted images are immediately added to catalogFiles instead of going to a pending list.

Replace the current handlePromptImagePaste function with this:

const handlePromptImagePaste = async (tab:string, e:any) => {
  const items = Array.from(e?.clipboardData?.items || []);
  const files = items
    .filter((item:any)=>String(item?.type || "").startsWith("image/"))
    .map((item:any)=>item.getAsFile())
    .filter(Boolean);

  if(!files.length) return;
  e.preventDefault();
  await addCatalogFilesDirectly(tab, files);
};

3) Replace the current upload handler so it also directly appends files.

const handlePromptImageUpload = async (tab:string, e:any) => {
  const files = Array.from(e?.target?.files || []);
  await addCatalogFilesDirectly(tab, files);
  if(e?.target) e.target.value = "";
};

4) Remove / stop using these old functions and states if they still exist:
- addPastedPromptImageToCatalog
- removePastedPromptImage
- pendingPromptImages

======================================================================
B. UPDATE buildEcommercePrompt() SO IT USES ONLY SELECTED STRUCTURE ITEMS
======================================================================

Inside buildEcommercePrompt(), replace the hardcoded output structure block with this:

const selectedSections = getSelectedEcommerceSections();

const structureBlock = selectedSections
  .map((section:string, idx:number)=>`${idx + 1}. ${section}`)
  .join("\n");

Then ensure the returned prompt includes something like:

Required output sections:
${structureBlock}

Important output rule:
- Only generate the selected sections above.
- Do not add unselected sections.
- Do not number the final output headings unless the prompt explicitly requests numbering.
- Output must be clean, ready to copy, paste, and use.

======================================================================
C. UPDATE THE E-COMMERCE UI BLOCK
======================================================================

Inside renderAiWorkspace(tab), in the ecommerce section:

1) Replace the current "Catalog image reader" toolbar block with this:

<div
  tabIndex={0}
  contentEditable={false}
  onPaste={(e:any)=>handlePromptImagePaste(tab,e)}
  onClick={(e:any)=>{ try { e.currentTarget.focus(); } catch {} }}
  style={{
    marginBottom:10,
    padding:"10px 12px",
    border:`1.5px dashed ${catalogFiles.length ? "#86EFAC" : C.border}`,
    borderRadius:10,
    background:catalogFiles.length ? "#ECFDF5" : C.bg,
    outline:"none",
    cursor:"text"
  }}
>
  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap" }}>
    <div style={{ minWidth:0,flex:"1 1 260px" }}>
      <p style={{ margin:0,fontSize:12,fontWeight:850,color:C.text }}>Catalog image reader</p>
      <p style={{ margin:"2px 0 0",fontSize:11,color:C.muted }}>
        Paste or upload one or more catalog / product images for visual reference.
      </p>
      {!!catalogFiles.length && (
        <p style={{ margin:"4px 0 0",fontSize:11,color:C.faint,fontWeight:700 }}>
          {catalogFiles.length} reference image{catalogFiles.length > 1 ? "s" : ""} added
        </p>
      )}
    </div>

    <label style={{
      display:"inline-flex",
      alignItems:"center",
      justifyContent:"center",
      height:32,
      padding:"0 12px",
      borderRadius:7,
      border:`1px solid ${C.border}`,
      background:C.surface,
      color:C.textSub,
      fontSize:11,
      fontWeight:800,
      cursor:"pointer",
      whiteSpace:"nowrap"
    }}>
      Upload Reference Images
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e:any)=>handlePromptImageUpload(tab,e)}
        style={{ display:"none" }}
      />
    </label>
  </div>

  {catalogFiles.length > 0 && (
    <div style={{ marginTop:10,display:"flex",flexWrap:"wrap",gap:10 }}>
      {catalogFiles.map((file:any, idx:number)=>(
        <div key={file.id || `${file.name}-${idx}`} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
          <img
            src={file.dataUrl}
            alt={file.name || "Catalog reference"}
            style={{ width:64,height:64,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}` }}
          />
          <button
            onClick={(e:any)=>{ e.stopPropagation(); removeCatalogFile(tab, idx); }}
            style={{ border:"none",background:"#FEF2F2",color:"#DC2626",borderRadius:7,padding:"5px 8px",fontSize:10.5,fontWeight:800,cursor:"pointer" }}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )}
</div>

2) Remove the old pending-images thumbnail area and remove the "Choose Images" and "Add Reference" controls.

3) Replace the current "Required Output Structure" UI block with this selectable version:

<div style={{ padding:14,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12 }}>
  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap" }}>
    <h4 style={{ margin:0,fontSize:13,fontWeight:900,color:C.text }}>Required Output Structure</h4>
    <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
      <Btn
        xs
        variant="outline"
        onClick={()=>updateAiWorkspace("ecommerce", { selectedSections: getDefaultEcommerceSections() })}
      >
        Select All
      </Btn>
      <Btn
        xs
        variant="outline"
        onClick={()=>updateAiWorkspace("ecommerce", { selectedSections: [] })}
      >
        Clear All
      </Btn>
    </div>
  </div>

  <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:8 }}>
    {ecommerceOutputSections.map((section:string)=>{
      const active = getSelectedEcommerceSections().includes(section);
      return (
        <button
          key={section}
          type="button"
          onClick={()=>toggleEcommerceSection(section)}
          style={{
            display:"flex",
            alignItems:"center",
            gap:8,
            padding:"9px 10px",
            textAlign:"left",
            borderRadius:8,
            border:`1.5px solid ${active ? C.accent : C.border}`,
            background:active ? "#EEF2FF" : C.bg,
            cursor:"pointer"
          }}
        >
          <span style={{
            width:16,
            height:16,
            borderRadius:4,
            display:"inline-flex",
            alignItems:"center",
            justifyContent:"center",
            background:active ? C.accent : "transparent",
            border:`1.5px solid ${active ? C.accent : C.borderStrong}`,
            color:"#fff",
            fontSize:11,
            fontWeight:900,
            flexShrink:0
          }}>
            {active ? "✓" : ""}
          </span>
          <span style={{ fontSize:12,fontWeight:750,color:C.text }}>{section}</span>
        </button>
      );
    })}
  </div>

  <p style={{ margin:"10px 0 0",fontSize:11,color:C.faint }}>
    Only selected sections will be included in the generated prompt and output.
  </p>
</div>

======================================================================
D. OPTIONAL SAFETY: MAKE SURE EXISTING WORKSPACES HAVE DEFAULT SELECTIONS
======================================================================

Where checklist group AI workspace is initialized, ensure ecommerce includes:

selectedSections: [...ecommerceOutputSections]

If your workspace is dynamic and does not require explicit initialization, the helper fallback above is enough.

======================================================================
E. UPDATE THE EMPTY STATE MESSAGE
======================================================================

Replace:
"Generated e-commerce listing will appear here. Upload catalog references, click Use Listing Template, then Generate E-commerce Listing."

With:
"Generated e-commerce listing will appear here. Upload reference images if needed, select the output sections you want, then generate the listing."

======================================================================
F. GEMINI PAYLOAD NOTE
======================================================================

No route change is strictly required if the route already accepts:
- prompt
- selected products
- catalogFiles / reference images

But if you want the API payload to explicitly receive the selected structure, include:

selectedSections: getSelectedEcommerceSections(),

inside the generateEcommerceListing request body.

Example:

body: JSON.stringify({
  mode: "ecommerce",
  prompt,
  selectedProducts: productRows,
  catalogFiles,
  selectedSections: getSelectedEcommerceSections(),
})

This is optional if the selected sections are already merged into the final prompt text.
