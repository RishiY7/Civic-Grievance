import os

file_path = "static/index.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_modal = """<!-- Login Modal -->
<div id="loginModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 hidden flex-col justify-center items-center z-[5000] backdrop-blur-sm">
    <div class="bg-white rounded-lg shadow-xl w-80 p-6 relative">
        <button id="closeLoginBtn" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <div class="flex mb-4 border-b">
            <button id="tabLogin" class="w-1/2 py-2 text-center font-bold text-blue-600 border-b-2 border-blue-600">Login</button>
            <button id="tabSignup" class="w-1/2 py-2 text-center font-bold text-gray-500">Sign Up</button>
        </div>
        <h2 id="modalTitle" class="text-xl font-bold mb-2 text-gray-800">Login</h2>
        <div id="loginError" class="hidden text-red-500 text-sm mb-3 font-medium"></div>
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" id="adminUser" class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-gray-800">
        </div>
        <div class="mb-5">
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" id="adminPass" class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-gray-800">
        </div>
        <button id="submitLoginBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">Login</button>
        <button id="submitSignupBtn" class="hidden w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors">Sign Up</button>
    </div>
</div>
"""

script_lines = content.splitlines()
out_lines = []
for i, line in enumerate(script_lines):
    if line == "    <script>" and i + 1 < len(script_lines) and "function showToast" in script_lines[i+1]:
        out_lines.append(new_modal)
    out_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.write("\\n".join(out_lines))
