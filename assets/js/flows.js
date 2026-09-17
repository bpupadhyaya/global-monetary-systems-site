/* Global Monetary Systems — "How Money Actually Moves"
 * A fixed-tier network diagram of the real institutions and systems behind an
 * international payment, plus a step-by-step simulation of one real payment's
 * actual path. Built with D3 (selections, transitions, zoom) over a hand-laid
 * layered layout — not a force simulation — so the diagram stays legible and
 * reproducible rather than settling into a different shape every load.
 *
 * The core teaching point: SWIFT carries *instructions*, never money. Value
 * only ever moves by debiting/crediting accounts inside each currency's own
 * real-time settlement system, in central-bank money. Everything else (IMF,
 * World Bank, BIS, Treasury) is the surrounding architecture, not a hop any
 * single payment takes.
 */
(function () {
  "use strict";

  var COLOR = {
    global: { fill: "#e5f0fa", stroke: "#0b4f8a", text: "#0b4f8a" },
    centralbank: { fill: "#e3f5ec", stroke: "#14684c", text: "#0b3d2e" },
    infra: { fill: "#fdecd3", stroke: "#d97706", text: "#8a5406" },
    commercial: { fill: "#f4faf7", stroke: "#40544a", text: "#12211b" },
    enduser: { fill: "#ffffff", stroke: "#6b7f74", text: "#40544a" }
  };
  var EDGE_COLOR = { flow: "#178a5e", coop: "#8a9a91", operate: "#6b7f74" };

  var TIERS = [
    { key: "global", label: "Global institutions", order: ["imf", "worldbank", "bis", "treasury"] },
    { key: "centralbank", label: "Central banks", order: ["ecb", "boe", "pboc", "boj", "othercb", "fed"] },
    { key: "infra", label: "Messaging & settlement systems", order: ["target2", "chaps", "swift", "cips", "fedwire"] },
    { key: "commercial", label: "Commercial & correspondent banks", order: ["receiverbank", "correspondent", "senderbank"] },
    { key: "enduser", label: "Who actually asked for this", order: ["supplier", "business"] }
  ];

  var NODES = {
    imf: { label: "IMF", full: "International Monetary Fund", group: "global", r: 32,
      blurb: "Monitors exchange-rate policy across its 190 member countries and lends to governments facing a balance-of-payments crisis. It doesn't touch any individual payment — its role is keeping the whole system solvent, not moving your money." },
    worldbank: { label: "World Bank", full: "World Bank Group", group: "global", r: 32,
      blurb: "Lends to governments for long-term development projects — roads, power grids, health systems. Disbursements travel through ordinary correspondent-banking rails, the same ones a private payment uses." },
    bis: { label: "BIS", full: "Bank for International Settlements", group: "global", r: 32,
      blurb: "The “central bank for central banks.” Central banks hold accounts and settle balances with each other at the BIS, and its committees (like the CPMI) write the technical standards payment systems worldwide are built to." },
    treasury: { label: "U.S. Treasury", full: "United States Department of the Treasury", group: "global", r: 32,
      blurb: "Issues U.S. government debt and sets currency policy. The Federal Reserve acts as the Treasury's fiscal agent — Treasury decides fiscal policy, the Fed executes the monetary plumbing." },

    ecb: { label: "ECB", full: "European Central Bank", group: "centralbank", r: 30,
      blurb: "The central bank for the euro. Issues euros, sets the eurozone policy rate, and operates TARGET2, the system where euro payments finally settle in central-bank money." },
    boe: { label: "Bank of England", full: "Bank of England", group: "centralbank", r: 30,
      blurb: "The UK's central bank. Issues sterling and operates CHAPS, the UK's real-time settlement system for high-value sterling payments." },
    pboc: { label: "PBoC", full: "People's Bank of China", group: "centralbank", r: 30,
      blurb: "China's central bank. Issues the renminbi and operates CIPS, its cross-border interbank payment system, alongside China's domestic RTGS." },
    boj: { label: "Bank of Japan", full: "Bank of Japan", group: "centralbank", r: 30,
      blurb: "Japan's central bank. Issues the yen and operates BOJ-NET, Japan's own real-time settlement system — the same design pattern as every other currency here." },
    othercb: { label: "Other central banks", full: "~185 other national central banks", group: "centralbank", r: 30,
      blurb: "Every currency on earth has one issuer and one settlement system behind it — the same pattern shown here for the dollar and euro repeats, country by country, worldwide." },
    fed: { label: "Federal Reserve", full: "Federal Reserve System", group: "centralbank", r: 30,
      blurb: "The U.S. central bank. Issues the dollar, sets the policy rate, and operates Fedwire and (with the private-sector CHIPS system) where dollar payments actually settle." },

    target2: { label: "TARGET2", full: "TARGET2 (Eurozone RTGS)", group: "infra", r: 26,
      blurb: "The Eurosystem's real-time gross settlement system. Every euro payment above the smallest retail amounts ultimately settles here, as a balance-sheet entry at the ECB." },
    chaps: { label: "CHAPS", full: "Clearing House Automated Payment System (UK)", group: "infra", r: 26,
      blurb: "The UK's real-time settlement system for high-value sterling payments, operated under the Bank of England." },
    swift: { label: "SWIFT", full: "Society for Worldwide Interbank Financial Telecommunication", group: "infra", r: 34,
      blurb: "A secure messaging network connecting over 11,000 banks in 200+ countries — and this is the detail almost everyone misses: SWIFT carries instructions, not money. No dollar or euro ever moves through SWIFT itself." },
    cips: { label: "CIPS", full: "Cross-Border Interbank Payment System (China)", group: "infra", r: 26,
      blurb: "China's settlement system for cross-border renminbi payments, run under the People's Bank of China." },
    fedwire: { label: "Fedwire / CHIPS", full: "Fedwire Funds Service & CHIPS", group: "infra", r: 26,
      blurb: "The U.S. real-time settlement systems. Fedwire settles directly on the Fed's own books; CHIPS is a private-sector net-settlement system for the bulk of large-value dollar payments." },

    receiverbank: { label: "Receiver's Bank", full: "Beneficiary bank, Frankfurt", group: "commercial", r: 28,
      blurb: "The German supplier's bank. It receives the SWIFT instruction, waits for the euro leg to settle at TARGET2, then credits the supplier's account." },
    correspondent: { label: "Correspondent Bank", full: "A global bank holding both USD and EUR accounts", group: "commercial", r: 28,
      blurb: "Most bank pairs don't hold accounts with each other directly. A correspondent bank that already holds both currencies bridges the gap — receiving dollars on one side, converting them, and releasing euros on the other." },
    senderbank: { label: "Sender's Bank", full: "Originating bank, New York", group: "commercial", r: 28,
      blurb: "The U.S. business's bank. It sends the SWIFT instruction and settles the dollar leg — debiting its own Fed account, not “sending” the physical dollars anywhere." },

    supplier: { label: "German Supplier", full: "The beneficiary", group: "enduser", r: 18,
      blurb: "Gets paid in euros, days after the instruction was sent, but usually within minutes of the underlying settlement actually clearing." },
    business: { label: "U.S. Business", full: "The payer", group: "enduser", r: 18,
      blurb: "Owes €10,000 to a supplier in Frankfurt and tells its bank to pay it — the event that starts everything else on this page." }
  };

  var EDGES = [
    // the payment path — always drawn, only "lit up" during simulation
    { s: "business", t: "senderbank", type: "flow", step: 0 },
    { s: "senderbank", t: "swift", type: "flow", step: 1 },
    { s: "swift", t: "receiverbank", type: "flow", step: 1 },
    { s: "senderbank", t: "fedwire", type: "flow", step: 2 },
    { s: "fedwire", t: "correspondent", type: "flow", step: 2 },
    { s: "correspondent", t: "target2", type: "flow", step: 3 },
    { s: "target2", t: "receiverbank", type: "flow", step: 3 },
    { s: "receiverbank", t: "supplier", type: "flow", step: 4 },
    // who operates which settlement system
    { s: "fed", t: "fedwire", type: "operate" },
    { s: "ecb", t: "target2", type: "operate" },
    { s: "boe", t: "chaps", type: "operate" },
    { s: "pboc", t: "cips", type: "operate" },
    // the surrounding architecture — never part of a single payment's path
    { s: "treasury", t: "fed", type: "coop" },
    { s: "fed", t: "bis", type: "coop" },
    { s: "ecb", t: "bis", type: "coop" },
    { s: "boe", t: "bis", type: "coop" },
    { s: "pboc", t: "bis", type: "coop" },
    { s: "boj", t: "bis", type: "coop" },
    { s: "othercb", t: "bis", type: "coop" },
    { s: "imf", t: "othercb", type: "coop" },
    { s: "worldbank", t: "correspondent", type: "coop" },
    { s: "bis", t: "swift", type: "coop" }
  ];

  var STEPS = [
    { k: "Step 1", t: "The business instructs its bank", d: "A U.S. business owes €10,000 to a supplier in Frankfurt. It tells its own bank to pay — that instruction is the only thing that has happened so far." },
    { k: "Step 2", t: "SWIFT carries the message — not the money", d: "The sender's bank sends a SWIFT payment instruction to the receiver's bank. This is the step almost everyone misunderstands: SWIFT is a messaging network. No money moves through it." },
    { k: "Step 3", t: "The dollar leg settles in central-bank money", d: "The sender's bank settles the USD side via Fedwire/CHIPS, debiting its own account at the Federal Reserve and crediting the correspondent bank's dollar account. This is the first moment value actually moves." },
    { k: "Step 4", t: "The euro leg settles the same way", d: "The correspondent bank converts the dollars to euros and settles the EUR side via TARGET2 — a balance-sheet entry at the European Central Bank crediting the receiver's bank." },
    { k: "Step 5", t: "The supplier gets paid", d: "The receiver's bank credits the German supplier's account. Total elapsed time: usually minutes to a few hours for the settlement itself — the transatlantic 'wire' feeling instant is the messaging layer; the value took the real path you just watched." }
  ];

  var W = 1200, H = 700, MARGIN = 90;
  var TIER_Y = [70, 230, 390, 540, 650];

  function layout() {
    var pos = {};
    TIERS.forEach(function (tier, ti) {
      var order = tier.order, n = order.length;
      var usable = W - 2 * MARGIN;
      order.forEach(function (id, i) {
        var x = MARGIN + (usable * (i + 0.5)) / n;
        pos[id] = { x: x, y: TIER_Y[ti], group: tier.key };
      });
    });
    return pos;
  }

  function init() {
    var mount = document.getElementById("flows-svg");
    if (!mount || typeof d3 === "undefined") return;

    var pos = layout();
    var svg = d3.select(mount)
      .attr("viewBox", "0 0 " + W + " " + H)
      .attr("role", "img")
      .attr("aria-label", "Network diagram of the institutions and systems behind an international payment");

    var zoomLayer = svg.append("g").attr("class", "zoom-layer");

    // tier backdrop labels
    zoomLayer.selectAll(".tier-label")
      .data(TIERS).enter().append("text")
      .attr("class", "flows-tier-label")
      .attr("x", MARGIN * 0.3)
      .attr("y", function (d, i) { return TIER_Y[i] - (i === 4 ? 26 : 46); })
      .text(function (d) { return d.label; });

    // edges
    var edgeSel = zoomLayer.append("g").attr("class", "edges")
      .selectAll("path").data(EDGES).enter().append("path")
      .attr("d", edgePath)
      .attr("fill", "none")
      .attr("stroke", function (d) { return EDGE_COLOR[d.type]; })
      .attr("stroke-width", function (d) { return d.type === "flow" ? 2 : 1.4; })
      .attr("stroke-dasharray", function (d) { return d.type === "coop" ? "3 4" : d.type === "operate" ? "1 4" : null; })
      .attr("opacity", function (d) { return d.type === "flow" ? 0.22 : 0.35; })
      .attr("data-s", function (d) { return d.s; })
      .attr("data-t", function (d) { return d.t; })
      .attr("data-step", function (d) { return d.step; })
      .attr("data-type", function (d) { return d.type; });

    function edgePath(d) {
      var a = pos[d.s], b = pos[d.t];
      var midY = (a.y + b.y) / 2;
      return "M" + a.x + "," + a.y + " C" + a.x + "," + midY + " " + b.x + "," + midY + " " + b.x + "," + b.y;
    }

    // the moving token used during simulation
    var token = zoomLayer.append("circle")
      .attr("class", "flows-token")
      .attr("r", 7).attr("fill", "#0b3d2e").attr("stroke", "#fff").attr("stroke-width", 2)
      .attr("opacity", 0);

    // nodes
    var nodeIds = Object.keys(NODES);
    var nodeG = zoomLayer.append("g").attr("class", "nodes")
      .selectAll("g").data(nodeIds).enter().append("g")
      .attr("class", "flows-node")
      .attr("id", function (d) { return "node-" + d; })
      .attr("transform", function (d) { return "translate(" + pos[d].x + "," + pos[d].y + ")"; })
      .on("mouseenter", function (event, d) { highlight(d); })
      .on("mouseleave", function () { highlight(null); })
      .on("click", function (event, d) { showPanel(d); highlight(d); });

    nodeG.append("circle").attr("class", "halo")
      .attr("r", function (d) { return NODES[d].r + 6; })
      .attr("stroke", function (d) { return COLOR[NODES[d].group].stroke; });

    nodeG.append("circle")
      .attr("r", function (d) { return NODES[d].r; })
      .attr("fill", function (d) { return COLOR[NODES[d].group].fill; })
      .attr("stroke", function (d) { return COLOR[NODES[d].group].stroke; })
      .attr("stroke-width", function (d) { return d === "swift" ? 2.6 : 1.6; });

    nodeG.each(function (d) {
      var g = d3.select(this), r = NODES[d].r;
      var words = NODES[d].label.split(" ");
      var lines = wrapLabel(words, d === "swift" || NODES[d].group === "global" ? 9 : 11);
      lines.forEach(function (line, i) {
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("y", (i - (lines.length - 1) / 2) * 12 + 4)
          .attr("font-size", r >= 30 ? 11.5 : r >= 26 ? 10.5 : 9.5)
          .attr("font-weight", 700)
          .attr("fill", COLOR[NODES[d].group].text)
          .text(line);
      });
    });

    function wrapLabel(words, maxChars) {
      var lines = [], cur = "";
      words.forEach(function (w) {
        var next = cur ? cur + " " + w : w;
        if (next.length > maxChars && cur) { lines.push(cur); cur = w; } else { cur = next; }
      });
      if (cur) lines.push(cur);
      return lines;
    }

    function highlight(id) {
      d3.selectAll(".flows-node").classed("active", false);
      if (!id) {
        edgeSel.attr("opacity", function (d) { return d.type === "flow" ? 0.22 : 0.35; });
        return;
      }
      d3.select("#node-" + id).classed("active", true);
      edgeSel.attr("opacity", function (d) {
        return (d.s === id || d.t === id) ? 0.95 : 0.08;
      });
    }

    function showPanel(id) {
      var n = NODES[id];
      var panel = document.getElementById("flows-panel");
      if (!panel) return;
      panel.innerHTML =
        '<div class="ph">' + TIERS.find(function (t) { return t.key === n.group; }).label + '</div>' +
        "<h3>" + n.label + "</h3>" +
        (n.full !== n.label ? '<p class="hint">' + n.full + "</p>" : "") +
        "<p>" + n.blurb + "</p>";
    }

    // zoom / pan
    var zoom = d3.zoom().scaleExtent([0.6, 2.5]).on("zoom", function (event) {
      zoomLayer.attr("transform", event.transform);
    });
    svg.call(zoom);
    document.getElementById("flows-zoom-in").addEventListener("click", function () { svg.transition().duration(200).call(zoom.scaleBy, 1.3); });
    document.getElementById("flows-zoom-out").addEventListener("click", function () { svg.transition().duration(200).call(zoom.scaleBy, 0.75); });
    document.getElementById("flows-zoom-reset").addEventListener("click", function () { svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity); });

    // ---- simulation controls ----
    var stepIdx = -1, playing = false, timer = null;
    var stepsFor = [0, 1, 2, 3, 4];

    function edgesForStep(k) { return EDGES.filter(function (d) { return d.type === "flow" && d.step === k; }); }

    function renderCaption() {
      var box = document.getElementById("flows-caption");
      if (stepIdx < 0) {
        box.innerHTML = '<div class="step-t">Press Play to follow a real €10,000 payment, New York to Frankfurt.</div>' +
          '<div class="step-d">Every node above is real. Click any of them any time to see what it does.</div>';
      } else {
        var s = STEPS[stepIdx];
        box.innerHTML = '<div class="step-k">' + s.k + " of 5</div><div class=\"step-t\">" + s.t + '</div><div class="step-d">' + s.d + "</div>";
      }
      document.querySelectorAll(".flows-steps .dot").forEach(function (dot, i) {
        dot.classList.toggle("done", i < stepIdx);
        dot.classList.toggle("active", i === stepIdx);
      });
    }

    function paintStep(k) {
      edgeSel
        .attr("stroke-width", function (d) { return d.type === "flow" ? (d.step <= k ? 3.4 : 2) : (d.type === "operate" ? 1.4 : 1.4); })
        .attr("opacity", function (d) {
          if (d.type !== "flow") return 0.15;
          return d.step === k ? 1 : d.step < k ? 0.55 : 0.12;
        })
        .attr("stroke", function (d) { return d.type === "flow" ? "#178a5e" : EDGE_COLOR[d.type]; });

      var edges = edgesForStep(k);
      if (!edges.length) { token.attr("opacity", 0); return; }
      token.attr("opacity", 1);
      animateAlong(edges, 0);
    }

    function animateAlong(edges, i) {
      if (i >= edges.length) return;
      var e = edges[i], a = pos[e.s], b = pos[e.t];
      token.attr("cx", a.x).attr("cy", a.y);
      token.transition().duration(700).ease(d3.easeCubicInOut)
        .attr("cx", b.x).attr("cy", b.y)
        .on("end", function () { animateAlong(edges, i + 1); });
    }

    function goto(i) {
      stepIdx = Math.max(-1, Math.min(4, i));
      renderCaption();
      if (stepIdx < 0) {
        edgeSel.attr("opacity", function (d) { return d.type === "flow" ? 0.22 : 0.35; })
          .attr("stroke-width", function (d) { return d.type === "flow" ? 2 : 1.4; });
        token.attr("opacity", 0);
      } else {
        paintStep(stepIdx);
      }
      document.getElementById("flows-prev").disabled = stepIdx <= -1;
      document.getElementById("flows-next").disabled = stepIdx >= 4;
    }

    function play() {
      playing = true;
      document.getElementById("flows-play").textContent = "⏸ Pause";
      tick();
    }
    function tick() {
      if (!playing) return;
      if (stepIdx >= 4) { pause(); return; }
      goto(stepIdx + 1);
      timer = setTimeout(tick, 3200);
    }
    function pause() {
      playing = false;
      clearTimeout(timer);
      document.getElementById("flows-play").textContent = "▶ Play";
    }

    document.getElementById("flows-play").addEventListener("click", function () { playing ? pause() : play(); });
    document.getElementById("flows-prev").addEventListener("click", function () { pause(); goto(stepIdx - 1); });
    document.getElementById("flows-next").addEventListener("click", function () { pause(); goto(stepIdx + 1); });
    document.getElementById("flows-reset").addEventListener("click", function () { pause(); goto(-1); svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity); });

    goto(-1);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
