import fs from 'fs/promises'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

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

  await fs.rm(path.join(projectRoot, '.next/cache'), { recursive: true, force: true })
  await fs.rm(path.join(projectRoot, '.next/dev'), { recursive: true, force: true })

  console.log('🧹 Cleaning build folder...')

  await fs.rm(buildDir, { recursive: true, force: true })
  await fs.mkdir(buildDir, { recursive: true })

  console.log('📦 Copying files...')

  await fs.cp(path.join(projectRoot, '.next'), path.join(buildDir, '.next'), { recursive: true })
  await fs.cp(path.join(projectRoot, 'public'), path.join(buildDir, 'public'), { recursive: true })
  await fs.cp(path.join(projectRoot, 'package.json'), path.join(buildDir, 'package.json'))

  //await fs.cp(path.join(__dirname, '.env'), path.join(buildDir, '.env'))

  console.log('✔️ Build folder is ready')

}

async function publish() {
  try {

    await prepareBuildFolder()

    await fs.rm(archivePath, { force: true })

    console.log('📦 Compressing build folder...')

    execSync(
      `tar -czf "${archivePath}" -C "${buildDir}" .`,
      { stdio: 'inherit' }
    )

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