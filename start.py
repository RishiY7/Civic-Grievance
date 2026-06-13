import subprocess
import sys
import os
import time

def main():
    print("Starting Civic Grievance Project...")

    # Determine paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "frontend")
    
    # Check for virtual environment python
    if os.name == 'nt':
        venv_python = os.path.join(base_dir, "venv", "Scripts", "python.exe")
        npm_cmd = "npm.cmd"
    else:
        venv_python = os.path.join(base_dir, "venv", "bin", "python")
        npm_cmd = "npm"
    
    if os.path.exists(venv_python):
        print(f"Using virtual environment Python: {venv_python}")
        python_exe = venv_python
    else:
        print(f"Virtual environment not found, using system Python: {sys.executable}")
        python_exe = sys.executable

    # Command to run the backend
    backend_cmd = [python_exe, "-m", "uvicorn", "main:app", "--reload"]
    
    # Command to run the frontend
    frontend_cmd = [npm_cmd, "run", "dev"]

    backend_process = None
    frontend_process = None

    try:
        print("-> Starting Backend (FastAPI)...")
        # stdout/stderr left as None so they print directly to the current terminal
        backend_process = subprocess.Popen(backend_cmd, cwd=base_dir)

        print("-> Starting Frontend (Vite)...")
        frontend_process = subprocess.Popen(frontend_cmd, cwd=frontend_dir)

        print("\n=======================================================")
        print("Both servers are running.")
        print("Backend should be available at: http://127.0.0.1:8000")
        print("Frontend should be available at: http://localhost:5173")
        print("Press Ctrl+C in this terminal to stop both servers.")
        print("=======================================================\n")

        # Keep the main script running to wait for Ctrl+C
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nInterrupt received. Shutting down servers...")
        
        # Cross-platform way to terminate the subprocess tree
        if os.name == 'nt':
            # On Windows, terminating the npm process doesn't always kill the node/vite child processes.
            # taskkill with /T (tree) and /F (force) is safer to prevent orphaned node processes.
            if backend_process:
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(backend_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if frontend_process:
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            if backend_process:
                backend_process.terminate()
            if frontend_process:
                frontend_process.terminate()
            
        print("Servers stopped successfully.")
        sys.exit(0)
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        if os.name == 'nt':
             if backend_process:
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(backend_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
             if frontend_process:
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            if backend_process:
                backend_process.terminate()
            if frontend_process:
                frontend_process.terminate()
        sys.exit(1)

if __name__ == "__main__":
    main()
