import { NextRequest } from "next/server";
import { getFlow } from "@/lib/db/repositories/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsString(s: string): string {
  return JSON.stringify(s);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const flowId = searchParams.get("flowId")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";

  if (!flowId || !token) {
    return new Response("// Voiceflow embed: missing flowId or token query parameter.\n", {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const flow = await getFlow(flowId);
  if (!flow?.embedEnabled || !flow.embedToken || flow.embedToken !== token) {
    return new Response("// Voiceflow embed: invalid or unpublished flow.\n", {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const origin = new URL(req.url).origin;
  const embedUrl = `${origin}/embed/${encodeURIComponent(flowId)}?t=${encodeURIComponent(token)}`;

  const js = `(function(){
  var EMBED_URL = ${jsString(embedUrl)};
  var Z = 2147483646;
  if (document.getElementById("lvf-embed-root")) return;
  var root = document.createElement("div");
  root.id = "lvf-embed-root";
  root.setAttribute("data-lvf-embed", "1");
  root.style.cssText = "position:fixed;bottom:0;right:0;z-index:"+Z+";font-family:system-ui,sans-serif;";
  var btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Chat";
  btn.setAttribute("aria-label", "Open chat");
  btn.style.cssText = "margin:16px;padding:12px 18px;border-radius:9999px;border:none;cursor:pointer;font-weight:600;box-shadow:0 4px 14px rgba(0,0,0,.2);background:#111827;color:#fff;";
  var panel = document.createElement("div");
  panel.style.cssText = "display:none;position:absolute;bottom:64px;right:16px;width:min(100vw - 32px, 400px);height:min(100dvh - 96px, 560px);max-height:560px;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.25);background:#fff;";
  var close = document.createElement("button");
  close.type = "button";
  close.textContent = "×";
  close.setAttribute("aria-label", "Close chat");
  close.style.cssText = "position:absolute;top:6px;right:8px;z-index:1;width:32px;height:32px;border:none;border-radius:8px;cursor:pointer;font-size:20px;line-height:1;background:rgba(0,0,0,.06);";
  var frame = document.createElement("iframe");
  frame.src = EMBED_URL;
  frame.title = "Chat";
  frame.style.cssText = "width:100%;height:100%;border:0;display:block;";
  frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  panel.appendChild(close);
  panel.appendChild(frame);
  root.appendChild(panel);
  root.appendChild(btn);
  document.body.appendChild(root);
  var open = false;
  function setOpen(v) {
    open = v;
    panel.style.display = v ? "block" : "none";
  }
  btn.addEventListener("click", function() { setOpen(!open); });
  close.addEventListener("click", function() { setOpen(false); });
})();`;

  return new Response(js, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
