# ⚡ Quick Deploy Commands (Copy-Paste करें)

## 🚀 Terminal mein ye commands run karo:

### 1️⃣ Git Setup करो
```bash
cd d:\complete_digital_education_ecosystem
git init
git config user.name "tiwarianuj0134-gif"
git config user.email "your-email@gmail.com"
git add .
git commit -m "Initial commit: Develop Verse - Complete Digital Education Platform"
```

### 2️⃣ GitHub Repository से Connect करो
```bash
git remote add origin https://github.com/tiwarianuj0134-gif/Develop_Verse.git
git branch -M main
git push -u origin main
```

---

## ✅ GitHub का Verification करो:
- https://github.com/tiwarianuj0134-gif/Develop_Verse खोलो
- Files upload हुई हैं या नहीं check करो

---

## 🌐 Vercel par Deploy करो:

### Option 1: Website se (Easiest)
1. https://vercel.com/new खोलो
2. "Import Git Repository" दबाओ
3. अपना GitHub account connect करो
4. `Develop_Verse` repository select करो
5. Environment Variables add करो:
   - `VITE_CONVEX_URL` = `https://academic-lemur-543.convex.cloud`
6. "Deploy" दबाओ

### Option 2: Vercel CLI से
```bash
npm i -g vercel
vercel
```
Instructions follow करो

---

## 🔧 Environment Variables (Vercel में Add करने हैं):

```
VITE_CONVEX_URL = https://academic-lemur-543.convex.cloud
```

---

## ✨ Ready!
Deploy हो गया तो website URL आएगा like:
```
https://develop-verse.vercel.app
```

---

## 📱 Local Testing (पहले test करना चाहो?)
```bash
npm install
npm run dev
```
फिर http://localhost:5175 खोलो

---

## 🎯 Issues?
1. Terminal में error आए तो screenshot भेजो
2. Vercel logs देखो: https://vercel.com/dashboard
3. GitHub push fail हो तो: `git pull origin main` फिर `git push`

**Questions? पूछो!** 🚀
