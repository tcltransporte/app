module.exports = {
  apps: [
    {
      name: "tcl-transporte",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "C:/Dropbox/app",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      windowsHide: true
    }
  ]
};