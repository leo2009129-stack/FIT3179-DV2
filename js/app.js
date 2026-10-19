/* Every chart uses a standalone, readable Vega-Lite JSON file. */
'use strict';
window.chartViews = {};
window.chartErrors = [];
function sizeForeignMap(spec, containerWidth) {
  const width = Math.max(220, Math.floor(containerWidth) - 18);
  const world = spec.vconcat[0];
  world.width = width;
  world.height = Math.max(185, Math.round(width * .43));
  const details = spec.vconcat[1];
  const panels = details.hconcat;
  for (const panel of panels) panel.width = width < 560 ? width : Math.floor((width - 30) / 2);
  if (width < 560) {
    details.vconcat = panels;
    delete details.hconcat;
    details.spacing = 22;
    spec.title.text = '135 entities · 13 jurisdictions';
    spec.title.subtitle = ['ASX Foreign Entity Report', '30 September 2026 · 136 security codes', 'News Corporation counted once'];
    world.layer[2].mark.fontSize = 10;
    world.layer[2].transform[1].calculate = "datum.iso_a3 + ' · ' + datum.count";
  }
}
async function startStory() {
  const inventory = await fetch('charts/inventory.json').then(r => {if(!r.ok)throw new Error('Chart inventory unavailable');return r.json();});
  await document.fonts.ready;
  await Promise.all(inventory.map(async item => {
    const target = document.getElementById(`chart-${item.id}`);
    try {
      const spec = await fetch(`charts/${item.id}.vl.json`).then(r => {if(!r.ok)throw new Error(`Specification ${r.status}`);return r.json();});
      const small = target.clientWidth < 600;
      const foreignSource = item.id === '10-symbols' ? structuredClone(spec) : null;
      if (item.id === '10-symbols') {
        // Geographic enlargements stay inside the same proportional-symbol
        // figure. Stack them on narrow screens; never move geographic anchors.
        sizeForeignMap(spec, target.clientWidth);
      }
      if (small && item.id === '11-bhp') {
        spec.layer[2].mark.fontSize = 11;
        spec.layer[2].mark.dx = {expr: "datum.name === 'Prominent Hill' ? -9 : 9"};
        spec.height = 355;
      }
      if (small && item.id === '01-directory') {
        spec.layer[0].encoding.y.axis.labelLimit = Math.max(105, target.clientWidth * .43);
        spec.layer[0].encoding.y.axis.labelFontSize = 10;
        spec.layer[1].mark.fontSize = 10;
      }
      if (small && ['05-boxplot','06-heatmap'].includes(item.id)) {
        const e = spec.encoding;
        e.y.axis.labelLimit = Math.max(100,target.clientWidth*.4);
        e.y.axis.labelFontSize = 10;
      }
      if (small && item.id === '04-histogram') {
        // Stable ID retained; this is now the sector count-versus-weight plot.
        for (const layer of spec.layer) {
          layer.encoding.y.axis.labelLimit = Math.max(100,target.clientWidth*.36);
          layer.encoding.y.axis.labelFontSize = 10;
          layer.encoding.x.title = 'Share (%)';
        }
        spec.layer[1].encoding.color.legend.direction = 'vertical';
        spec.layer[1].encoding.color.legend.columns = 1;
        spec.layer[1].encoding.color.legend.labelFontSize = 11;
        spec.layer[2].mark.fontSize = 10;
      }
      if (small && item.id === '12-waterfall') {
        spec.layer[0].mark.size = Math.min(30,target.clientWidth/18);
        spec.layer[1].mark.fontSize = 9;
        spec.encoding.x.axis.labelFontSize = 9;
      }
      if (small && item.id === '02-treemap') spec.layer[1].mark.fontSize=9;
      target.replaceChildren();
      const result = await vegaEmbed(target,spec,{renderer:'svg',actions:false,tooltip:{theme:'light'},defaultStyle:true});
      window.chartViews[item.id] = result.view;
      if (item.id === '05-boxplot') {
        // Reuse the composite mark's existing median, quartiles and whiskers.
        // Vega-Lite's generated aggregates and all geometry remain unchanged.
        const defaultTooltip = result.view.tooltip();
        const fields = spec.usermeta.tooltip_fields;
        result.view.tooltip((handler, event, mark, value) => {
          if (value != null && mark && mark.datum) {
            const d = mark.datum;
            const text = {Sector: d.sector};
            const keys = Number.isFinite(d.mid_box_weight)
              ? ['mid_box_weight', 'lower_box_weight', 'upper_box_weight']
              : Number.isFinite(d.lower_whisker_weight)
                ? ['lower_whisker_weight', 'upper_whisker_weight'] : ['weight'];
            if (keys[0] === 'weight') {text['ASX code'] = d.code; text.Company = d.name;}
            for (const key of keys) if (Number.isFinite(d[key])) text[fields[key]] = d[key].toFixed(2) + '%';
            value = text;
          }
          defaultTooltip(handler, event, mark, value);
        });
        await result.view.runAsync();
      }

      if (foreignSource) {
        let renderedWidth = Math.round(target.clientWidth);
        let wantedWidth = renderedWidth;
        let timer, drawing = false;
        const redraw = async () => {
          if (drawing) return;
          drawing = true;
          try {
            while (renderedWidth !== wantedWidth) {
              const width = wantedWidth;
              const next = structuredClone(foreignSource);
              sizeForeignMap(next, width);
              window.chartViews[item.id].finalize();
              const embedded = await vegaEmbed(target,next,{renderer:'svg',actions:false,tooltip:{theme:'light'},defaultStyle:true});
              window.chartViews[item.id] = embedded.view;
              renderedWidth = width;
            }
          } catch(error) {
            window.chartErrors.push({id:item.id,error:String(error)});
            console.error(item.id,error);
          } finally { drawing = false; }
        };
        new ResizeObserver(entries => {
          const width = Math.round(entries[0].contentRect.width);
          if (width < 1 || width === wantedWidth) return;
          wantedWidth = width;
          clearTimeout(timer);
          timer = setTimeout(redraw,150);
        }).observe(target);
      }
    } catch(error) {
      window.chartErrors.push({id:item.id,error:String(error)});
      target.classList.add('chart-error');target.textContent='This chart could not load. Please run the project through a local HTTP server and check its data files.';
      console.error(item.id,error);
    }
  }));
  const [states,counts] = await Promise.all(['state-mining','mine-counts'].map(n=>fetch(`data/${n}.json`).then(r=>r.json())));
  const countMap = Object.fromEntries(counts.map(r=>[r.state,r.count]));
  document.getElementById('state-table').innerHTML = states.map(r=>`<tr><td>${r.state}</td><td>${(r.mining_gva_m/1000).toFixed(3)}</td><td>${r.mining_share.toFixed(2)}%</td><td>${countMap[r.state]}</td></tr>`).join('');
  document.getElementById('render-status').textContent=`${Object.keys(window.chartViews).length} charts loaded.`;
  window.storyReady = true;
}
startStory().catch(e=>{window.chartErrors.push({id:'app',error:String(e)});console.error(e);});
