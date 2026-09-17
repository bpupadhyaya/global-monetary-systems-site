/* Global Monetary Systems — "Simulate a Payment"
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
 * single payment takes. The active payment path renders as an animated,
 * flowing ribbon (marching-dash CSS animation) rather than a static line, so
 * the diagram actually reads as money moving, not just a wiring schematic.
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
  var EDGE_COLOR = { flow: "#178a5e", coop: "#96a89e", operate: "#6b7f74" };
  var DIM = {
    global: { w: 122, h: 50 },
    centralbank: { w: 114, h: 48 },
    infra: { w: 108, h: 46 },
    commercial: { w: 122, h: 48 },
    enduser: { w: 100, h: 40 }
  };

  var TIERS = [
    { key: "global", label: "Global institutions", order: ["imf", "worldbank", "bis", "treasury"] },
    { key: "centralbank", label: "Central banks", order: ["ecb", "boe", "pboc", "boj", "othercb", "fed"] },
    { key: "infra", label: "Messaging & settlement systems", order: ["target2", "chaps", "swift", "cips", "fedwire"] },
    { key: "commercial", label: "Commercial & correspondent banks", order: ["receiverbank", "correspondent", "senderbank"] },
    { key: "enduser", label: "Who actually asked for this", order: ["supplier", "business"] }
  ];

  var NODES = {
    imf: { label: "IMF", full: "International Monetary Fund", group: "global",
      blurb: "Monitors exchange-rate policy across its 190 member countries and lends to governments facing a balance-of-payments crisis. It doesn't touch any individual payment — its role is keeping the whole system solvent, not moving your money." },
    worldbank: { label: "World Bank", full: "World Bank Group", group: "global",
      blurb: "Lends to governments for long-term development projects — roads, power grids, health systems. Disbursements travel through ordinary correspondent-banking rails, the same ones a private payment uses." },
    bis: { label: "BIS", full: "Bank for International Settlements", group: "global",
      blurb: "The “central bank for central banks.” Central banks hold accounts and settle balances with each other at the BIS, and its committees (like the CPMI) write the technical standards payment systems worldwide are built to." },
    treasury: { label: "U.S. Treasury", full: "United States Department of the Treasury", group: "global",
      blurb: "Issues U.S. government debt and sets currency policy. The Federal Reserve acts as the Treasury's fiscal agent — Treasury decides fiscal policy, the Fed executes the monetary plumbing." },

    ecb: { label: "ECB", full: "European Central Bank", group: "centralbank",
      blurb: "The central bank for the euro. Issues euros, sets the eurozone policy rate, and operates TARGET2, the system where euro payments finally settle in central-bank money." },
    boe: { label: "Bank of England", full: "Bank of England", group: "centralbank",
      blurb: "The UK's central bank. Issues sterling and operates CHAPS, the UK's real-time settlement system for high-value sterling payments." },
    pboc: { label: "PBoC", full: "People's Bank of China", group: "centralbank",
      blurb: "China's central bank. Issues the renminbi and operates CIPS, its cross-border interbank payment system, alongside China's domestic RTGS." },
    boj: { label: "Bank of Japan", full: "Bank of Japan", group: "centralbank",
      blurb: "Japan's central bank. Issues the yen and operates BOJ-NET, Japan's own real-time settlement system — the same design pattern as every other currency here." },
    othercb: { label: "Other central banks", full: "~185 other national central banks", group: "centralbank",
      blurb: "Every currency on earth has one issuer and one settlement system behind it — the same pattern shown here for the dollar and euro repeats, country by country, worldwide." },
    fed: { label: "Federal Reserve", full: "Federal Reserve System", group: "centralbank",
      blurb: "The U.S. central bank. Issues the dollar, sets the policy rate, and operates Fedwire and (with the private-sector CHIPS system) where dollar payments actually settle." },

    target2: { label: "TARGET2", full: "TARGET2 (Eurozone RTGS)", group: "infra",
      blurb: "The Eurosystem's real-time gross settlement system. Every euro payment above the smallest retail amounts ultimately settles here, as a balance-sheet entry at the ECB." },
    chaps: { label: "CHAPS", full: "Clearing House Automated Payment System (UK)", group: "infra",
      blurb: "The UK's real-time settlement system for high-value sterling payments, operated under the Bank of England." },
    swift: { label: "SWIFT", full: "Society for Worldwide Interbank Financial Telecommunication", group: "infra", big: true,
      blurb: "A secure messaging network connecting over 11,000 banks in 200+ countries — and this is the detail almost everyone misses: SWIFT carries instructions, not money. No dollar or euro ever moves through SWIFT itself." },
    cips: { label: "CIPS", full: "Cross-Border Interbank Payment System (China)", group: "infra",
      blurb: "China's settlement system for cross-border renminbi payments, run under the People's Bank of China." },
    fedwire: { label: "Fedwire / CHIPS", full: "Fedwire Funds Service & CHIPS", group: "infra",
      blurb: "The U.S. real-time settlement systems. Fedwire settles directly on the Fed's own books; CHIPS is a private-sector net-settlement system for the bulk of large-value dollar payments." },

    receiverbank: { label: "Receiver's Bank", full: "Beneficiary bank, Frankfurt", group: "commercial",
      blurb: "The German supplier's bank. It receives the SWIFT instruction, waits for the euro leg to settle at TARGET2, then credits the supplier's account." },
    correspondent: { label: "Correspondent Bank", full: "A global bank holding both USD and EUR accounts", group: "commercial",
      blurb: "Most bank pairs don't hold accounts with each other directly. A correspondent bank that already holds both currencies bridges the gap — receiving dollars on one side, converting them, and releasing euros on the other." },
    senderbank: { label: "Sender's Bank", full: "Originating bank, New York", group: "commercial",
      blurb: "The U.S. business's bank. It sends the SWIFT instruction and settles the dollar leg — debiting its own Fed account, not “sending” the physical dollars anywhere." },

    supplier: { label: "German Supplier", full: "The beneficiary", group: "enduser",
      blurb: "Gets paid in euros, days after the instruction was sent, but usually within minutes of the underlying settlement actually clearing." },
    business: { label: "U.S. Business", full: "The payer", group: "enduser",
      blurb: "Owes €10,000 to a supplier in Frankfurt and tells its bank to pay it — the event that starts everything else on this page." }
  };

  var EDGES = [
    // the payment path — always drawn, "lit up" (flowing ribbon) during simulation
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
  var TIER_Y = [70, 232, 392, 542, 652];

  function dims(id) {
    var n = NODES[id], d = DIM[n.group];
    return n.big ? { w: d.w + 22, h: d.h + 8 } : d;
  }

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
    var mount = document.getElementById("sim-svg");
    if (!mount || typeof d3 === "undefined") return;

    var pos = layout();
    var svg = d3.select(mount)
      .attr("viewBox", "0 0 " + W + " " + H)
      .attr("role", "img")
      .attr("aria-label", "Network diagram of the institutions and systems behind an international payment");

    var defs = svg.append("defs");
    var shadow = defs.append("filter").attr("id", "sim-shadow").attr("x", "-40%").attr("y", "-40%").attr("width", "180%").attr("height", "180%");
    shadow.append("feDropShadow").attr("dx", 0).attr("dy", 2).attr("stdDeviation", 3).attr("flood-color", "#0b3d2e").attr("flood-opacity", 0.18);

    var zoomLayer = svg.append("g").attr("class", "zoom-layer");

    zoomLayer.selectAll(".tier-label")
      .data(TIERS).enter().append("text")
      .attr("class", "sim-tier-label")
      .attr("x", MARGIN * 0.3)
      .attr("y", function (d, i) { return TIER_Y[i] - (i === 4 ? 26 : 44); })
      .text(function (d) { return d.label; });

    function anchor(id, edgeId) {
      var p = pos[id], d = dims(id);
      var toward = pos[edgeId];
      var top = toward.y < p.y;
      return { x: p.x, y: p.y + (top ? -d.h / 2 : d.h / 2) };
    }

    function edgePath(d) {
      var a = anchor(d.s, d.t), b = anchor(d.t, d.s);
      var midY = (a.y + b.y) / 2;
      return "M" + a.x + "," + a.y + " C" + a.x + "," + midY + " " + b.x + "," + midY + " " + b.x + "," + b.y;
    }

    var edgeSel = zoomLayer.append("g").attr("class", "edges")
      .selectAll("path").data(EDGES).enter().append("path")
      .attr("d", edgePath)
      .attr("fill", "none")
      .attr("class", function (d) { return d.type === "flow" ? "sim-edge-flow" : ""; })
      .attr("stroke", function (d) { return EDGE_COLOR[d.type]; })
      .attr("stroke-width", function (d) { return d.type === "flow" ? 3 : 1.4; })
      .attr("stroke-dasharray", function (d) { return d.type === "coop" ? "2 5" : d.type === "flow" ? null : "1 4"; })
      .attr("opacity", function (d) { return d.type === "flow" ? 0.16 : 0.4; })
      .attr("data-step", function (d) { return d.step; })
      .attr("data-type", function (d) { return d.type; });

    var token = zoomLayer.append("circle")
      .attr("class", "sim-token")
      .attr("r", 8).attr("fill", "#0b3d2e").attr("stroke", "#fff").attr("stroke-width", 2.5)
      .attr("opacity", 0);

    var nodeIds = Object.keys(NODES);
    var nodeG = zoomLayer.append("g").attr("class", "nodes")
      .selectAll("g").data(nodeIds).enter().append("g")
      .attr("class", "sim-node")
      .attr("id", function (d) { return "node-" + d; })
      .attr("transform", function (d) { return "translate(" + pos[d].x + "," + pos[d].y + ")"; })
      .on("mouseenter", function (event, d) { highlight(d); })
      .on("mouseleave", function () { highlight(null); })
      .on("click", function (event, d) { showPanel(d); highlight(d); });

    nodeG.append("rect").attr("class", "halo")
      .attr("x", function (d) { return -dims(d).w / 2 - 7; })
      .attr("y", function (d) { return -dims(d).h / 2 - 7; })
      .attr("width", function (d) { return dims(d).w + 14; })
      .attr("height", function (d) { return dims(d).h + 14; })
      .attr("rx", function (d) { return dims(d).h / 2 + 7; })
      .attr("stroke", function (d) { return COLOR[NODES[d].group].stroke; });

    var chip = nodeG.append("g").attr("class", "chip");
    chip.append("rect")
      .attr("x", function (d) { return -dims(d).w / 2; })
      .attr("y", function (d) { return -dims(d).h / 2; })
      .attr("width", function (d) { return dims(d).w; })
      .attr("height", function (d) { return dims(d).h; })
      .attr("rx", function (d) { return dims(d).h / 2; })
      .attr("fill", function (d) { return COLOR[NODES[d].group].fill; })
      .attr("stroke", function (d) { return COLOR[NODES[d].group].stroke; })
      .attr("stroke-width", function (d) { return NODES[d].big ? 2.4 : 1.6; })
      .attr("filter", "url(#sim-shadow)");

    chip.each(function (d) {
      var g = d3.select(this), h = dims(d).h;
      var words = NODES[d].label.split(" ");
      var lines = wrapLabel(words, NODES[d].group === "global" || NODES[d].big ? 10 : 13);
      lines.forEach(function (line, i) {
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("y", (i - (lines.length - 1) / 2) * 13 + 4)
          .attr("font-size", h >= 48 ? 12 : h >= 44 ? 11 : 10)
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
      d3.selectAll(".sim-node").classed("active", false);
      if (!id) {
        edgeSel.attr("opacity", function (d) { return d.type === "flow" ? 0.16 : 0.4; });
        return;
      }
      d3.select("#node-" + id).classed("active", true);
      edgeSel.attr("opacity", function (d) {
        return (d.s === id || d.t === id) ? 0.95 : 0.08;
      });
    }

    function showPanel(id) {
      var n = NODES[id];
      var panel = document.getElementById("sim-panel");
      if (!panel) return;
      panel.innerHTML =
        '<div class="ph">' + TIERS.find(function (t) { return t.key === n.group; }).label + '</div>' +
        "<h3>" + n.label + "</h3>" +
        (n.full !== n.label ? '<p class="hint">' + n.full + "</p>" : "") +
        "<p>" + n.blurb + "</p>";
    }

    var zoom = d3.zoom().scaleExtent([0.6, 2.5]).on("zoom", function (event) {
      zoomLayer.attr("transform", event.transform);
    });
    svg.call(zoom);
    document.getElementById("sim-zoom-in").addEventListener("click", function () { svg.transition().duration(200).call(zoom.scaleBy, 1.3); });
    document.getElementById("sim-zoom-out").addEventListener("click", function () { svg.transition().duration(200).call(zoom.scaleBy, 0.75); });
    document.getElementById("sim-zoom-reset").addEventListener("click", function () { svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity); });

    // ---- simulation controls ----
    var stepIdx = -1, playing = false, timer = null;

    function edgesForStep(k) { return EDGES.filter(function (d) { return d.type === "flow" && d.step === k; }); }

    function renderCaption() {
      var box = document.getElementById("sim-caption");
      if (stepIdx < 0) {
        box.innerHTML = '<div class="step-t">Press Play to follow a real €10,000 payment, New York to Frankfurt.</div>' +
          '<div class="step-d">Every node above is real. Click any of them any time to see what it does.</div>';
      } else {
        var s = STEPS[stepIdx];
        box.innerHTML = '<div class="step-k">' + s.k + " of 5</div><div class=\"step-t\">" + s.t + '</div><div class="step-d">' + s.d + "</div>";
      }
      document.querySelectorAll(".sim-steps .dot").forEach(function (dot, i) {
        dot.classList.toggle("done", i < stepIdx);
        dot.classList.toggle("active", i === stepIdx);
      });
    }

    function paintStep(k) {
      edgeSel
        .classed("on", function (d) { return d.type === "flow" && d.step === k; })
        .attr("stroke-dasharray", function (d) {
          if (d.type !== "flow") return d.type === "coop" ? "2 5" : "1 4";
          return d.step === k ? "10 8" : null;
        })
        .attr("stroke-width", function (d) { return d.type === "flow" ? (d.step === k ? 4.5 : d.step < k ? 3 : 2) : 1.4; })
        .attr("opacity", function (d) {
          if (d.type !== "flow") return 0.15;
          return d.step === k ? 1 : d.step < k ? 0.55 : 0.12;
        });

      var edges = edgesForStep(k);
      if (!edges.length) { token.attr("opacity", 0); return; }
      token.attr("opacity", 1);
      animateAlong(edges, 0);
    }

    function animateAlong(edges, i) {
      if (i >= edges.length) return;
      var e = edges[i], a = anchor(e.s, e.t), b = anchor(e.t, e.s);
      token.attr("cx", a.x).attr("cy", a.y);
      token.transition().duration(750).ease(d3.easeCubicInOut)
        .attr("cx", b.x).attr("cy", b.y)
        .on("end", function () { animateAlong(edges, i + 1); });
    }

    function goto(i) {
      stepIdx = Math.max(-1, Math.min(4, i));
      renderCaption();
      if (stepIdx < 0) {
        edgeSel.classed("on", false)
          .attr("stroke-dasharray", function (d) { return d.type === "coop" ? "2 5" : d.type === "flow" ? null : "1 4"; })
          .attr("opacity", function (d) { return d.type === "flow" ? 0.16 : 0.4; })
          .attr("stroke-width", function (d) { return d.type === "flow" ? 3 : 1.4; });
        token.attr("opacity", 0);
      } else {
        paintStep(stepIdx);
      }
      document.getElementById("sim-prev").disabled = stepIdx <= -1;
      document.getElementById("sim-next").disabled = stepIdx >= 4;
    }

    function play() {
      playing = true;
      document.getElementById("sim-play").textContent = "⏸ Pause";
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
      document.getElementById("sim-play").textContent = "▶ Play";
    }

    document.getElementById("sim-play").addEventListener("click", function () { playing ? pause() : play(); });
    document.getElementById("sim-prev").addEventListener("click", function () { pause(); goto(stepIdx - 1); });
    document.getElementById("sim-next").addEventListener("click", function () { pause(); goto(stepIdx + 1); });
    document.getElementById("sim-reset").addEventListener("click", function () { pause(); goto(-1); svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity); });

    goto(-1);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
