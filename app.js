let currentDirection = 'LONG';
    let currentLivePrice = 0;
    let tpSlMode = 'PRICE'; // 'PRICE' or 'PCT'
    let ws = null;
    let pricePollInterval = null;
    let currentExchange = 'MEXC'; // 'MEXC' | 'BINANCE'
    let currentMarket = 'FUTURES'; // 'FUTURES' | 'SPOT'
    let allSymbols = [];
    let filteredSymbols = [];
    let dropdownOpen = false;
    let highlightedIndex = -1;

    // — formato precio: >=1 => 2 decimales, <1 => mínimo 4 decimales y 4 dígitos significativos
    function decimalsForPrice(p) {
      if (!isFinite(p) || p <= 0) return 4;
      if (p >= 1) return 2;
      const exp = Math.floor(Math.log10(p)); // negativo
      return Math.min(Math.max(-exp + 3, 4), 20);
    }
    function fmtPrice(p) { // "$0.8500" / "$65,000.00"
      if (!isFinite(p) || p === 0) return "$0.00";
      if (p >= 1) return "$" + p.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
      const d = decimalsForPrice(p);
      return "$" + p.toFixed(d);
    }
    function fmtPriceInput(p) { // sin "$", para inputs type=number
      if (!isFinite(p) || p === 0) return "0.0000";
      if (p >= 1) return p.toFixed(2);
      return p.toFixed(decimalsForPrice(p));
    }
    // MEXC bloquea CORS sin ACAO -> usa proxy como fallback
    async function mexcFetch(url){
      try{
        const r = await fetch(url);
        if(r.ok) return r;
        throw new Error('http '+r.status);
      }catch(e){
        const prox = 'https://corsproxy.io/?' + encodeURIComponent(url);
        return fetch(prox); // corsproxy añade ACAO
      }
    }
    function normalizeSym(s){ return (s||'').toUpperCase().replace(/[\s\/_]/g,''); }
    function displaySym(sym){
      // Futuros: ticker sin slash (SUIUSDT), Spot: con slash (SUI / USDT)
      if(currentMarket==='FUTURES') return sym.replace('_','');
      return sym.replace('_','').replace('USDT',' / USDT');
    }
    function displayInputSym(sym){ return sym.replace('_',''); } // siempre SUIUSDT en el input
    function toTvSymbol(sym){ return sym.replace('_',''); }
    function setExchange(ex){
      currentExchange = ex;
      updateTogglesUI();
      const cur = getCurrentSymbol();
      fetchSymbols().then(()=>{
        const norm = normalizeSym(cur);
        const found = allSymbols.find(s=> normalizeSym(s)===norm);
        if(found) document.getElementById('assetSearch').value = displayInputSym(found);
        else if(allSymbols.length) document.getElementById('assetSearch').value = displayInputSym(allSymbols[0]);
        onAssetChange();
      });
    }
    function setMarket(m){
      currentMarket = m;
      updateTogglesUI();
      const cur = getCurrentSymbol();
      fetchSymbols().then(()=>{
        const norm = normalizeSym(cur);
        const found = allSymbols.find(s=> normalizeSym(s)===norm);
        if(found) document.getElementById('assetSearch').value = displayInputSym(found);
        else if(allSymbols.length) document.getElementById('assetSearch').value = displayInputSym(allSymbols[0]);
        onAssetChange();
      });
    }
    function updateTogglesUI(){
      const btnMexc = document.getElementById('btnMexc');
      const btnBin = document.getElementById('btnBinance');
      const btnFut = document.getElementById('btnFutures');
      const btnSpot = document.getElementById('btnSpot');
      const label = document.getElementById('livePriceLabel');
      if(currentExchange==='MEXC'){
        btnMexc.className="px-2.5 py-1 text-[11px] font-black rounded-md bg-accentYellow text-black shadow";
        btnBin.className="px-2.5 py-1 text-[11px] font-black rounded-md text-gray-400 hover:text-white";
      } else {
        btnBin.className="px-2.5 py-1 text-[11px] font-black rounded-md bg-accentYellow text-black shadow";
        btnMexc.className="px-2.5 py-1 text-[11px] font-black rounded-md text-gray-400 hover:text-white";
      }
      if(currentMarket==='FUTURES'){
        btnFut.className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-binanceInput text-accentYellow border border-gray-700";
        btnSpot.className="px-2.5 py-1 text-[11px] font-bold rounded-md text-gray-400 hover:text-white";
      } else {
        btnSpot.className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-binanceInput text-accentYellow border border-gray-700";
        btnFut.className="px-2.5 py-1 text-[11px] font-bold rounded-md text-gray-400 hover:text-white";
      }
      if(label) label.innerText = `Precio Live ${currentExchange} — ${currentMarket}`;
    }

    // Populate Leverage Options (1x to 50x)
    const levSelect = document.getElementById('leverageSelect');
    for (let i = 1; i <= 50; i++) {
      let opt = document.createElement('option');
      opt.value = i;
      opt.innerText = i + 'x';
      if (i === 20) opt.selected = true;
      levSelect.appendChild(opt);
    }

    function setTpSlMode(mode) {
      tpSlMode = mode;
      const modePriceBtn = document.getElementById('modePriceBtn');
      const modePctBtn = document.getElementById('modePctBtn');
      const priceContainer = document.getElementById('priceInputsContainer');
      const pctContainer = document.getElementById('pctInputsContainer');

      if (mode === 'PRICE') {
        modePriceBtn.className = "px-2 py-0.5 text-[10px] font-bold rounded text-accentYellow bg-binanceInput border border-gray-700";
        modePctBtn.className = "px-2 py-0.5 text-[10px] font-bold rounded text-gray-400 hover:text-white";
        priceContainer.classList.remove('hidden');
        pctContainer.classList.add('hidden');
      } else {
        modePctBtn.className = "px-2 py-0.5 text-[10px] font-bold rounded text-accentYellow bg-binanceInput border border-gray-700";
        modePriceBtn.className = "px-2 py-0.5 text-[10px] font-bold rounded text-gray-400 hover:text-white";
        pctContainer.classList.remove('hidden');
        priceContainer.classList.add('hidden');
      }
      calculate();
    }

    function setDirection(dir) {
      currentDirection = dir;
      const bLong = document.getElementById('btnLong');
      const bShort = document.getElementById('btnShort');

      if (dir === 'LONG') {
        bLong.className = "py-2.5 rounded-md font-bold text-sm transition-all duration-200 bg-accentGreen text-gray-950 shadow-md flex justify-center items-center space-x-1";
        bShort.className = "py-2.5 rounded-md font-bold text-sm transition-all duration-200 text-gray-400 hover:text-white flex justify-center items-center space-x-1";
      } else {
        bShort.className = "py-2.5 rounded-md font-bold text-sm transition-all duration-200 bg-accentRed text-white shadow-md flex justify-center items-center space-x-1";
        bLong.className = "py-2.5 rounded-md font-bold text-sm transition-all duration-200 text-gray-400 hover:text-white flex justify-center items-center space-x-1";
      }
      calculate();
    }

    function stopLive(){
      if(ws){ try{ ws.close(); }catch(_){} ws=null; }
      if(pricePollInterval){ clearInterval(pricePollInterval); pricePollInterval=null; }
    }
    function connectBinanceWS(symbol) {
      stopLive();
      const isFutures = currentMarket==='FUTURES';
      const streamName = symbol.replace('_','').toLowerCase() + '@ticker';
      const url = isFutures ? `wss://fstream.binance.com/ws/${streamName}` : `wss://stream.binance.com:9443/ws/${streamName}`;
      ws = new WebSocket(url);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        currentLivePrice = parseFloat(data.c);
        const priceChangePercent = parseFloat(data.P);
        updateLiveDom(currentLivePrice, priceChangePercent);
      };
      ws.onerror = ()=>{ /* fallback a polling si WS falla en futures */ };
    }
    function updateLiveDom(price, pct){
      const livePriceEl = document.getElementById('livePrice');
      const priceChangeEl = document.getElementById('priceChange');
      if(!isFinite(price)) return;
      livePriceEl.innerText = fmtPrice(price);
      if(pct>=0){
        priceChangeEl.innerText = `+${pct.toFixed(2)}%`;
        priceChangeEl.className = "text-xs font-semibold text-accentGreen";
      } else {
        priceChangeEl.innerText = `${pct.toFixed(2)}%`;
        priceChangeEl.className = "text-xs font-semibold text-accentRed";
      }
    }
    async function fetchMexcTicker(symbol){
      try{
        if(currentMarket==='FUTURES'){
          const r = await mexcFetch(`https://api.mexc.com/api/v1/contract/ticker?symbol=${symbol}`);
          const j = await r.json();
          const d = j.data || j;
          const last = parseFloat(d.lastPrice);
          const pct = parseFloat(d.riseFallRate)*100;
          if(isFinite(last)){ currentLivePrice = last; updateLiveDom(last, isFinite(pct)?pct:0); }
        } else {
          const tvSym = symbol.replace('_','');
          const r = await mexcFetch(`https://api.mexc.com/api/v3/ticker/24hr?symbol=${tvSym}`);
          const d = await r.json();
          const o = Array.isArray(d) ? d.find(x=> normalizeSym(x.symbol)===normalizeSym(tvSym)) : d;
          const last = parseFloat(o.lastPrice ?? o.lastprice ?? o.price);
          const pct = parseFloat(o.priceChangePercent ?? o.change_rate ?? 0);
          const pctNorm = Math.abs(pct) < 1 && Math.abs(pct) > 0 ? pct*100 : pct;
          if(isFinite(last)){ currentLivePrice = last; updateLiveDom(last, isFinite(pctNorm)?pctNorm:0); }
        }
      }catch(e){ /* silencioso, reintenta en siguiente intervalo */ }
    }
    function connectMexcFuturesWS(symbol){
      stopLive();
      const url = 'wss://contract.mexc.com/edge';
      ws = new WebSocket(url);
      ws.onopen = ()=> {
        ws.send(JSON.stringify({method:'sub.ticker', param:{symbol}}));
        // ping cada 20s para mantener vivo
        pricePollInterval = setInterval(()=> { try{ ws.send(JSON.stringify({method:'ping'})); }catch(_){} }, 20000);
      };
      ws.onmessage = (e)=>{
        try{
          const msg = JSON.parse(e.data);
          if(msg.method==='ping'){ ws.send(JSON.stringify({method:'pong'})); return; }
          if(msg.channel==='pong' || msg.method==='pong') return;
          const d = msg.data || msg;
          // push.ticker: {symbol, lastPrice, riseFallRate}
          if(d && d.lastPrice != null){
            if(d.symbol && normalizeSym(d.symbol)!==normalizeSym(symbol)) return;
            const last = parseFloat(d.lastPrice);
            const pct = parseFloat(d.riseFallRate)*100;
            if(isFinite(last)){ currentLivePrice = last; updateLiveDom(last, isFinite(pct)?pct:0); }
          }
        }catch(_){}
      };
      ws.onerror = ()=>{ // fallback a polling REST si WS falla
        stopLive();
        fetchMexcTicker(symbol);
        pricePollInterval = setInterval(()=> fetchMexcTicker(symbol), 3000);
      };
      ws.onclose = ()=>{ if(pricePollInterval) clearInterval(pricePollInterval); };
    }
    function connectMexcPoll(symbol){
      stopLive();
      fetchMexcTicker(symbol);
      pricePollInterval = setInterval(()=> fetchMexcTicker(symbol), 3000);
    }
    function connectLivePrice(symbol){
      if(currentExchange==='MEXC'){
        if(currentMarket==='FUTURES') connectMexcFuturesWS(symbol);
        else connectMexcPoll(symbol);
      } else connectBinanceWS(symbol);
    }

    function useLiveAsEntry() {
      if (currentLivePrice > 0) {
        document.getElementById('entryInput').value = fmtPriceInput(currentLivePrice);
        
        // Auto estimate default TP/SL if in price mode
        if (currentDirection === 'LONG') {
          document.getElementById('tpInput').value = fmtPriceInput(currentLivePrice * 1.03);
          document.getElementById('slInput').value = fmtPriceInput(currentLivePrice * 0.985);
        } else {
          document.getElementById('tpInput').value = fmtPriceInput(currentLivePrice * 0.97);
          document.getElementById('slInput').value = fmtPriceInput(currentLivePrice * 1.015);
        }
        calculate();
      }
    }

    function loadTradingViewChart(symbol) {
      document.getElementById('tradingview_container').innerHTML = '';
      const tvSym = toTvSymbol(symbol);
      const prefix = currentExchange==='MEXC' ? 'MEXC:' : 'BINANCE:';
      new TradingView.widget({
        "autosize": true,
        "symbol": prefix + tvSym,
        "interval": "15",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "es",
        "toolbar_bg": "#1e2329",
        "enable_publishing": false,
        "withdateranges": true,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "details": true,
        "hotlist": true,
        "container_id": "tradingview_container",
        "studies": [
          "STD;SMA",
          "STD;RSI"
        ]
      });
    }

    // — buscador de pares: MEXC / BINANCE × FUTURES / SPOT —
    async function fetchMexcFuturesSymbols(){
      const r = await mexcFetch('https://api.mexc.com/api/v1/contract/detail');
      if(!r.ok) throw new Error('mexc futures detail '+r.status);
      const j = await r.json();
      const arr = Array.isArray(j.data) ? j.data : (j.data ? [j.data] : []);
      return arr.filter(c=> c.quoteCoin==='USDT' && c.state===0 && c.futureType===1 && !c.isHidden)
                .map(c=> c.symbol) // BTC_USDT
                .sort();
    }
    async function fetchMexcSpotSymbols(){
      const r = await mexcFetch('https://api.mexc.com/api/v3/exchangeInfo');
      if(!r.ok) throw new Error('mexc spot '+r.status);
      const j = await r.json();
      const syms = (j.symbols||[]).filter(s=> s.status==='ENABLED' && s.quoteAsset==='USDT' && s.isSpotTradingAllowed).map(s=> s.symbol).sort();
      // fallback si usa status 1
      if(!syms.length){
        const alt = (j.symbols||[]).filter(s=> s.quoteAsset==='USDT').map(s=> s.symbol).sort();
        return alt;
      }
      return syms;
    }
    async function fetchBinanceSpotSymbols(){
      const r = await fetch('https://api.binance.com/api/v3/exchangeInfo');
      if(!r.ok) throw new Error('binance spot '+r.status);
      const j = await r.json();
      return (j.symbols||[]).filter(s=> s.status==='TRADING' && s.quoteAsset==='USDT' && s.isSpotTradingAllowed).map(s=> s.symbol).sort();
    }
    async function fetchBinanceFuturesSymbols(){
      const r = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo');
      if(!r.ok) throw new Error('binance futures '+r.status);
      const j = await r.json();
      return (j.symbols||[]).filter(s=> s.status==='TRADING' && s.quoteAsset==='USDT' && s.contractType==='PERPETUAL').map(s=> s.symbol).sort();
    }

    async function fetchSymbols() {
      const isMexc = currentExchange==='MEXC';
      const isFut = currentMarket==='FUTURES';
      const fallbackFut = isMexc ? (typeof MEXC_FUTURES_FALLBACK!=='undefined' ? MEXC_FUTURES_FALLBACK : ['BTC_USDT','ETH_USDT','SOL_USDT']) : ['BTCUSDT','ETHUSDT','SOLUSDT'];
      const fallbackSpot = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT'];
      const fallback = isFut ? fallbackFut : fallbackSpot;
      try {
        let syms=[];
        if(isMexc && isFut) syms = await fetchMexcFuturesSymbols();
        else if(isMexc && !isFut) syms = await fetchMexcSpotSymbols();
        else if(!isMexc && isFut) syms = await fetchBinanceFuturesSymbols();
        else syms = await fetchBinanceSpotSymbols();
        allSymbols = syms.length ? syms : fallback;
      } catch(e) {
        // fallback por ticker si el exchangeInfo falla (rate limit / CORS)
        try {
          if(isMexc && isFut){
            const r2 = await mexcFetch('https://api.mexc.com/api/v1/contract/ticker');
            const j2 = await r2.json();
            const list = Array.isArray(j2.data) ? j2.data : [];
            const syms2 = list.map(x=> x.symbol).filter(s=> s.endsWith('_USDT')).sort();
            allSymbols = syms2.length ? syms2 : fallback;
          } else if(isMexc){
            const r2 = await mexcFetch('https://api.mexc.com/api/v3/ticker/price');
            const j2 = await r2.json();
            allSymbols = j2.map(x=>x.symbol).filter(s=> s.endsWith('USDT')).sort();
            if(!allSymbols.length) allSymbols = fallback;
          } else if(isFut){
            const r2 = await fetch('https://fapi.binance.com/fapi/v1/ticker/price');
            const j2 = await r2.json();
            allSymbols = j2.map(x=>x.symbol).filter(s=> s.endsWith('USDT')).sort();
          } else {
            const r2 = await fetch('https://api.binance.com/api/v3/ticker/price');
            const j2 = await r2.json();
            allSymbols = j2.map(x=>x.symbol).filter(s=> s.endsWith('USDT')).sort();
          }
        } catch(_) { allSymbols = fallback; }
      }
      document.getElementById('assetCount').innerText = allSymbols.length + ' pares';
      renderDropdown(getCurrentSymbol());
    }

    function renderDropdown(filter) {
      const listEl = document.getElementById('assetDropdownList');
      const emptyEl = document.getElementById('assetDropdownEmpty');
      const q = normalizeSym(filter||'');
      filteredSymbols = q ? allSymbols.filter(s => normalizeSym(s).includes(q)) : allSymbols.slice(0, 80);
      // limita a 80 para no reventar el DOM
      const toShow = filteredSymbols.slice(0, 80);
      listEl.innerHTML = '';
      highlightedIndex = -1;
      if (!toShow.length) { emptyEl.classList.remove('hidden'); return; }
      emptyEl.classList.add('hidden');
      const curNorm = normalizeSym(getCurrentSymbol());
      toShow.forEach(sym => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isCur = normalizeSym(sym) === curNorm;
        btn.className = 'w-full text-left px-3 py-1.5 text-xs font-bold flex justify-between items-center hover:bg-binanceInput transition ' + (isCur ? 'bg-binanceInput text-accentYellow' : 'text-gray-300');
        btn.innerHTML = `<span>${displaySym(sym)}</span><span class="text-[10px] ${isCur ? 'text-accentYellow' : 'text-gray-500'}">${isCur ? '● actual' : ''}</span>`;
        btn.onclick = () => selectSymbol(sym);
        listEl.appendChild(btn);
      });
      if (filteredSymbols.length > 80) {
        const more = document.createElement('div');
        more.className = 'px-3 py-1.5 text-[10px] text-gray-500 text-center border-t border-binanceBorder';
        more.innerText = `+${filteredSymbols.length - 80} más — sigue escribiendo para filtrar`;
        listEl.appendChild(more);
      }
    }

    function getCurrentSymbol() {
      const el = document.getElementById('assetSearch');
      return (el.value || '').trim().toUpperCase().replace(/\s|\//g,'');
    }

    function selectSymbol(sym) {
      const el = document.getElementById('assetSearch');
      el.dataset.prev = '';
      el.value = displayInputSym(sym);
      closeAssetDropdown();
      onAssetChange();
    }
    function findSymbol(raw){
      const norm = normalizeSym(raw);
      return allSymbols.find(s=> normalizeSym(s)===norm) || null;
    }
    function onAssetSearchFocus(el){
      el.dataset.prev = el.value;
      el.value = '';
      openAssetDropdown();
      renderDropdown('');
    }
    function onAssetSearchBlur(el){
      // si dejó vacío y no eligió, restaura prev después de un tick (permite click en dropdown)
      setTimeout(()=>{
        if(el.value.trim()==='' && el.dataset.prev && !dropdownOpen){
          el.value = el.dataset.prev;
        }
        // si dejó vacío y dropdown cerrado sin selección, igual restaura para no dejar -- 
        if(el.value.trim()==='' && el.dataset.prev){
          // solo si no está escribiendo
          const stillEmpty = el.value.trim()==='';
          if(stillEmpty && document.activeElement!==el){
            el.value = el.dataset.prev;
          }
        }
      }, 180);
    }

    function openAssetDropdown() {
      const dd = document.getElementById('assetDropdown');
      dd.classList.remove('hidden');
      dropdownOpen = true;
      renderDropdown(getCurrentSymbol());
    }
    function closeAssetDropdown() {
      document.getElementById('assetDropdown').classList.add('hidden');
      dropdownOpen = false;
      highlightedIndex = -1;
    }
    function onAssetSearchInput() {
      const el = document.getElementById('assetSearch');
      el.value = el.value.toUpperCase();
      openAssetDropdown();
      renderDropdown(el.value.trim());
    }
    function onAssetSearchKeydown(e) {
      const items = document.getElementById('assetDropdownList').querySelectorAll('button');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!dropdownOpen) openAssetDropdown();
        highlightedIndex = Math.min(highlightedIndex + 1, items.length -1);
        highlightItem(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightedIndex = Math.max(highlightedIndex -1, 0);
        highlightItem(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && items[highlightedIndex]) items[highlightedIndex].click();
        else {
          const raw = getCurrentSymbol();
          const found = findSymbol(raw);
          if (found) selectSymbol(found);
          else if (filteredSymbols[0]) selectSymbol(filteredSymbols[0]);
        }
      } else if (e.key === 'Escape') closeAssetDropdown();
    }
    function highlightItem(items) {
      items.forEach((b,i)=>{
        b.classList.toggle('!bg-binanceInput', i===highlightedIndex);
        b.classList.toggle('!text-accentYellow', i===highlightedIndex);
      });
      if (items[highlightedIndex]) items[highlightedIndex].scrollIntoView({block:'nearest'});
    }
    // cierra al click fuera
    document.addEventListener('click', (e)=>{
      const wrap = document.getElementById('assetPickerWrap');
      if (wrap && !wrap.contains(e.target)) closeAssetDropdown();
    });

    function onAssetChange() {
      const raw = getCurrentSymbol();
      let symbol = findSymbol(raw);
      if(!symbol) symbol = allSymbols.includes(raw) ? raw : (raw || (currentExchange==='MEXC' && currentMarket==='FUTURES' ? 'BTC_USDT' : 'BTCUSDT'));
      if(!findSymbol(symbol)){
        const maybe = findSymbol(raw);
        if(maybe) symbol = maybe;
      }
      const found = findSymbol(symbol);
      if(found) {
        symbol = found;
        document.getElementById('assetSearch').value = displayInputSym(symbol);
      } else if(symbol){
        // si no está en lista, muestra tal cual sin underscore
        document.getElementById('assetSearch').value = displayInputSym(symbol);
      }
      connectLivePrice(symbol);
      loadTradingViewChart(symbol);
    }

    function onInputChange(changedSource) {
      calculate(changedSource);
    }

    function calculate(source) {
      const margin = parseFloat(document.getElementById('marginInput').value) || 0;
      const leverage = parseInt(document.getElementById('leverageSelect').value) || 1;
      const entry = parseFloat(document.getElementById('entryInput').value) || 0;

      const posValue = margin * leverage;
      document.getElementById('posValue').innerText = `$${posValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

      if (entry <= 0) return;

      const tokens = posValue / entry;
      document.getElementById('tokenSizeDisplay').innerText = `${tokens.toFixed(4)} Contratos`;

      // Estimated Liquidation Price
      let liq = 0;
      if (currentDirection === 'LONG') {
        liq = entry * (1 - (1 / leverage));
      } else {
        liq = entry * (1 + (1 / leverage));
      }
      document.getElementById('liqPrice').innerText = fmtPrice(liq);

      let tpPrice = 0;
      let slPrice = 0;
      let tpRoe = 0;
      let slRoe = 0;

      if (tpSlMode === 'PRICE') {
        tpPrice = parseFloat(document.getElementById('tpInput').value) || 0;
        slPrice = parseFloat(document.getElementById('slInput').value) || 0;

        let tpDiff = currentDirection === 'LONG' ? (tpPrice - entry) : (entry - tpPrice);
        let slDiff = currentDirection === 'LONG' ? (entry - slPrice) : (slPrice - entry);

        let tpProfit = tokens * tpDiff;
        let slLoss = tokens * slDiff;

        tpRoe = margin > 0 ? (tpProfit / margin) * 100 : 0;
        slRoe = margin > 0 ? (slLoss / margin) * 100 : 0;

        // Sync ROE % inputs
        document.getElementById('tpPctInput').value = tpRoe.toFixed(2);
        document.getElementById('slPctInput').value = slRoe.toFixed(2);

      } else {
        // ROE % Mode
        tpRoe = parseFloat(document.getElementById('tpPctInput').value) || 0;
        slRoe = parseFloat(document.getElementById('slPctInput').value) || 0;

        // Calculate Target Prices from ROE %
        let tpPriceMovePct = tpRoe / leverage;
        let slPriceMovePct = slRoe / leverage;

        if (currentDirection === 'LONG') {
          tpPrice = entry * (1 + (tpPriceMovePct / 100));
          slPrice = entry * (1 - (slPriceMovePct / 100));
        } else {
          tpPrice = entry * (1 - (tpPriceMovePct / 100));
          slPrice = entry * (1 + (slPriceMovePct / 100));
        }

        // Sync Price inputs
        document.getElementById('tpInput').value = fmtPriceInput(tpPrice);
        document.getElementById('slInput').value = fmtPriceInput(slPrice);
      }

      // Calculate Net Profits/Losses
      let tpProfitUSD = (tpRoe / 100) * margin;
      let slLossUSD = (slRoe / 100) * margin;

      // Update TP Card Display
      document.getElementById('tpProfit').innerText = `${tpProfitUSD >= 0 ? '+' : ''}$${tpProfitUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      document.getElementById('tpRoeDisplay').innerText = `${tpRoe >= 0 ? '+' : ''}${tpRoe.toFixed(2)}% ROE`;
      document.getElementById('tpDistDisplay').innerText = `Precio TP: ${fmtPrice(tpPrice)}`;

      // Update SL Card Display
      document.getElementById('slLoss').innerText = `-$${Math.abs(slLossUSD).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      document.getElementById('slRoeDisplay').innerText = `-${Math.abs(slRoe).toFixed(2)}% ROE`;
      document.getElementById('slDistDisplay').innerText = `Precio SL: ${fmtPrice(slPrice)}`;

      // Risk / Reward Ratio & Badge
      let rr = Math.abs(slLossUSD) > 0 ? (tpProfitUSD / Math.abs(slLossUSD)) : 0;
      document.getElementById('rrRatio').innerText = `${rr > 0 ? rr.toFixed(2) : '0.00'} : 1`;

      const badge = document.getElementById('rrBadge');
      if (rr >= 2.0) {
        badge.innerText = "EXCELENTE";
        badge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-accentGreen/20 text-accentGreen border border-accentGreen/30";
      } else if (rr >= 1.5) {
        badge.innerText = "ACEPTABLE";
        badge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-accentYellow/20 text-accentYellow border border-accentYellow/30";
      } else {
        badge.innerText = "DESFAVORABLE";
        badge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-accentRed/20 text-accentRed border border-accentRed/30";
      }
    }

    window.onload = () => {
      updateTogglesUI();
      fetchSymbols().then(()=> onAssetChange());
      calculate();
    };
