// lore.js — slider initialization for lore pages
(function(){
  'use strict'

  function parseArray(el, attr){
    try{ const v = el.getAttribute(attr); return v ? JSON.parse(v) : null }catch(e){ return null }
  }

  function setBackgroundFill(slider, val){
    const min = Number(slider.min) || 0
    const max = Number(slider.max) || 100
    const pct = Math.round(((val - min) / (max - min)) * 100)
    // read CSS variables (fall back to hard-coded colors)
    const cs = getComputedStyle(slider)
    const fill = cs.getPropertyValue('--lore-fill') || '#6ff0c8'
    const unfilled = cs.getPropertyValue('--lore-unfilled') || 'rgba(255,255,255,0.06)'
    slider.style.background = `linear-gradient(90deg, ${fill.trim()} ${pct}%, ${unfilled.trim()} ${pct}%)`
  }

  function initSlider(opts){
    const slider = document.getElementById(opts.id)
    if(!slider) return null
    // prevent double-initialization
    if(slider.dataset.loreInited) return null
    slider.dataset.loreInited = '1'

    const levelEl = opts.levelId ? document.getElementById(opts.levelId) : null
    const primaryEl = opts.primaryId ? document.getElementById(opts.primaryId) : null
    const secondaryEl = opts.secondaryId ? document.getElementById(opts.secondaryId) : null

    const primaryArr = parseArray(slider, 'data-level-values')
    const secondaryArr = parseArray(slider, 'data-level-cooldowns')

    const fallbackPrimary = opts.primaryFallback || (v=>v)
    const fallbackSecondary = opts.secondaryFallback || (v=>v)

    function update(){
      const min = Number(slider.min) || 0
      const max = Number(slider.max) || 100
      const val = Number(slider.value)
      if(levelEl) levelEl.textContent = 'Lv.' + val

      if(primaryEl){
        if(Array.isArray(primaryArr) && primaryArr[val - min] !== undefined) primaryEl.textContent = primaryArr[val - min]
        else primaryEl.textContent = fallbackPrimary(val)
      }
      if(secondaryEl){
        if(Array.isArray(secondaryArr) && secondaryArr[val - min] !== undefined) secondaryEl.textContent = secondaryArr[val - min]
        else secondaryEl.textContent = fallbackSecondary(val)
      }

      setBackgroundFill(slider, val)
    }

    slider.addEventListener('input', update, {passive:true})
    update()
    return { slider, update }
  }

  function initAllSliders(){
    // initialize known sliders; initSlider guards against double init
    initSlider({
      id: 'left-slider',
      levelId: 'left-level',
      primaryId: 'left-damage',
      primaryFallback(v){
        const lv1 = 421, lv10 = 807
        const t = (v - 1) / (10 - 1)
        return Math.round(lv1 + (lv10 - lv1) * t)
      }
    })

    initSlider({
      id: 'mid-slider',
      levelId: 'mid-level',
      primaryId: 'mid-damage',
      secondaryId: 'mid-cooldown-sec',
      secondaryFallback: v => v
    })
  }

  // run on initial load
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initAllSliders)
  } else {
    initAllSliders()
  }

  // Some themes (Material for MkDocs) use client-side navigation and don't reload scripts.
  // Use a MutationObserver to detect when new content is injected and initialize sliders then.
  const observer = new MutationObserver((mutations, obs) => {
    for(const m of mutations){
      for(const node of m.addedNodes){
        if(!(node instanceof HTMLElement)) continue
        if(node.querySelector && (node.querySelector('#left-slider') || node.querySelector('#mid-slider'))){
          initAllSliders()
          // we can keep observing in case the user navigates to other pages, so do not disconnect
          return
        }
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })

  // Also listen for popstate/pageshow events as fallback
  window.addEventListener('pageshow', initAllSliders)
  window.addEventListener('popstate', initAllSliders)

})()
