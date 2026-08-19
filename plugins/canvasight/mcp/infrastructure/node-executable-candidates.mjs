import os from "node:os";
import path from "node:path";

export function daemonNodeExecutableCandidates({
  env = process.env,
  execPath = process.execPath,
  platform = process.platform,
  homeDirectory = os.homedir()
} = {}) {
  const candidates = [];
  const seen = new Set();
  const platformPath = platform === "win32" ? path.win32 : path.posix;
  const add = (executable, source) => {
    if (typeof executable !== "string" || !executable.trim()) return;
    const normalized = executable.trim();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push({ executable: normalized, source });
  };
  const below = (directory, source) => {
    if (typeof directory === "string" && directory.trim()) add(platformPath.join(directory.trim(), platform === "win32" ? "node.exe" : "node"), source);
  };

  // Explicit configuration stays first, then a fresh PATH lookup. Long-lived
  // desktop hosts can retain an execPath whose version-manager target was
  // removed after a Node upgrade, so stable manager shims and installation
  // prefixes are also enumerated before giving up.
  add(env.CANVASIGHT_NODE_BIN, "configured");
  add(platform === "win32" ? "node.exe" : "node", "path");
  add(env.npm_node_execpath, "npm_node_execpath");
  add(execPath, "process_exec_path");
  below(env.VOLTA_HOME && platformPath.join(env.VOLTA_HOME, "bin"), "volta_home");
  below(env.NVM_BIN, "nvm_bin");
  below(env.FNM_MULTISHELL_PATH, "fnm_multishell");
  below(env.HOMEBREW_PREFIX && platformPath.join(env.HOMEBREW_PREFIX, "bin"), "homebrew_prefix");
  below(env.MISE_DATA_DIR && platformPath.join(env.MISE_DATA_DIR, "shims"), "mise_data");

  if (typeof homeDirectory === "string" && homeDirectory) {
    below(platformPath.join(homeDirectory, ".volta", "bin"), "volta_shim");
    below(platformPath.join(homeDirectory, ".nvm", "current", "bin"), "nvm_current");
    below(platformPath.join(homeDirectory, ".fnm", "current", "bin"), "fnm_current");
    below(platformPath.join(homeDirectory, ".asdf", "shims"), "asdf_shim");
    below(platformPath.join(homeDirectory, ".local", "share", "mise", "shims"), "mise_shim");
    below(platformPath.join(homeDirectory, ".local", "bin"), "user_local");
  }

  if (platform === "darwin") {
    add("/opt/homebrew/bin/node", "homebrew_apple_silicon");
    add("/usr/local/bin/node", "homebrew_intel");
    add("/usr/bin/node", "system");
  } else if (platform === "linux") {
    add("/usr/local/bin/node", "system_local");
    add("/usr/bin/node", "system");
    add("/snap/bin/node", "snap");
  } else if (platform === "win32") {
    below(env.ProgramFiles && platformPath.join(env.ProgramFiles, "nodejs"), "program_files");
    below(env.LOCALAPPDATA && platformPath.join(env.LOCALAPPDATA, "Programs", "nodejs"), "local_app_data");
  }

  return candidates;
}
