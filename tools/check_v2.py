import subprocess, sys, time, json
from playwright.sync_api import sync_playwright
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "-d", "docs"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2)
pages = ["index", "search", "hukamnama", "guru-granth-sahib", "dasam-granth", "vaaran", "library", "pothis", "model", "about", "signin"]
rep = {}
try:
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        for w in (1280, 390):
            pg = b.new_page(viewport={"width": w, "height": 900})
            errs = []
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append(str(e)))
            for n in pages:
                errs.clear()
                r = pg.goto(f"http://127.0.0.1:8765/{n}.html"); pg.wait_for_timeout(2500)
                sw = pg.evaluate("document.documentElement.scrollWidth")
                rep[f"{n}@{w}"] = {"status": r.status, "hscroll": sw > w, "errors": list(errs)[:3]}
                if n in ("index", "search", "hukamnama", "library") : pg.screenshot(path=f"docs/_review/{n}_{w}.png", full_page=(n!="library"))
            if w == 1280:
                for q in ("Ranjit", "Zafarnama", "Banda Singh Bahadur"):
                    pg.goto(f"http://127.0.0.1:8765/search.html?q={q}"); pg.wait_for_timeout(4000)
                    rep[f"search:{q}"] = pg.inner_text("#count")[:120]
                pg.screenshot(path="docs/_review/search_results_1280.png", full_page=False)
                pg.goto("http://127.0.0.1:8765/hukamnama.html"); pg.wait_for_timeout(6000)
                rep["hukamnama_lines"] = pg.locator(".line").count()
                pg.goto("http://127.0.0.1:8765/model.html"); pg.wait_for_timeout(1500)
                pg.fill("#tq", "g:hjkk"); pg.press("#tq", "Enter"); pg.wait_for_timeout(5000)
                pg.fill("#tq", "Anandpur"); pg.press("#tq", "Enter"); pg.wait_for_timeout(5000)
                rep["console_tail"] = pg.inner_text("#log")[-600:]
        b.close()
finally:
    srv.terminate()
print(json.dumps(rep, indent=1, ensure_ascii=False))
