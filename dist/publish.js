import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fse from 'fs-extra'
import fs from 'fs/promises'

import { rimraf } from 'rimraf'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// raiz do projeto (um nível acima da pasta publish)
const projectRoot = path.resolve(__dirname, '..')

// pasta onde será montado o build
const buildDir = path.join(__dirname, 'build')

// arquivo compactado
const archivePath = path.join(__dirname, 'release.tar.gz')

// agora o .env fica na própria pasta publish
//dotenv.config({ path: path.join(__dirname, '.env') })

async function prepareBuildFolder() {

  console.log('🧹 Cleaning cache folder...')

  rimraf.sync(path.join(projectRoot, '.next/cache'))
  rimraf.sync(path.join(projectRoot, '.next/dev'))

  console.log('🧹 Cleaning build folder...')

  await fse.remove(buildDir)
  await fs.mkdir(buildDir, { recursive: true })

  console.log('📦 Copying files...')

  await fse.copy(path.join(projectRoot, '.next'), path.join(buildDir, '.next'))
  await fse.copy(path.join(projectRoot, 'public'), path.join(buildDir, 'public'))
  await fse.copy(path.join(projectRoot, 'package.json'), path.join(buildDir, 'package.json'))

  //await fse.copy(path.join(__dirname, '.env'), path.join(buildDir, '.env'))

  console.log('✔️ Build folder is ready')

}

async function publish() {
  try {

    await prepareBuildFolder()

    console.log('📦 Compressing build folder...')

    execSync(`tar -czf ${archivePath} -C ${buildDir} .`, { stdio: 'inherit' })

    /*
    console.log('📤 Uploading archive via SCP...')

    const remoteUser = process.env.SSH_USER
    const remoteHost = process.env.SSH_HOST
    const remotePath = process.env.SSH_REMOTE_PATH || '~/app'

    execSync(`scp ${archivePath} ${remoteUser}@${remoteHost}:${remotePath}/release.tar.gz`, {
      stdio: 'inherit',
    })

    console.log('📦 Extracting archive on server...')

    execSync(
      `ssh ${remoteUser}@${remoteHost} "tar -xzf ${remotePath}/release.tar.gz -C ${remotePath} && rm ${remotePath}/release.tar.gz"`,
      { stdio: 'inherit' }
    )

    console.log('🔄 Restarting PM2...')

    execSync(`ssh ${remoteUser}@${remoteHost} "pm2 restart corepay"`, {
      stdio: 'inherit',
    })
    */

    console.log('✅ Deployment completed successfully!')

  } catch (err) {
    console.error('❌ Deployment failed:', err.message)
  }
}

publish()