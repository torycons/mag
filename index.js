const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const argvs = process.argv.slice(2)

class AssetsGenerator {
    constructor(inputFolderPath, outputFolderPath, platform) {
        this.inputFolderPath = inputFolderPath
        this.outputFolderPath = outputFolderPath
        this.platform = platform
        this.allPhotosCount = 0
        this.currentGeneratedPhotosCount = 0
    }

    generateAssets() {
        const availablePlatforms = ['ios', 'android']
        const platformName = this.platform.toLowerCase()

        if (availablePlatforms.includes(platformName)) {
            switch (platformName) {
                case 'ios':
                    this._generatePhotosIOS()
                    break;
                case 'android':
                    this._generatePhotosAndroid()
                    break;
                default:
                    console.log(`Your platform(${this.platform}) is not available.`)
                    break;
            }
        } else {
            console.log(`Your platform(${this.platform}) is not available.`)
        }
    }

    _createNewOutputFolder(folderName) {
        const newPhotoPath = `${this.outputFolderPath}/${folderName}/`
        if (fs.existsSync(newPhotoPath)) {
            fs.rmdirSync(newPhotoPath, { recursive: true })
        }
        fs.mkdirSync(newPhotoPath)
        return newPhotoPath
    }

    _readPhotoList() {
        const photoList = fs.readdirSync(this.inputFolderPath)
        const multiplier = this.platform.toLowerCase() === 'ios' ? 3 : 6
        this.allPhotosCount = photoList.length * multiplier
        return photoList
    }

    _generatePhotosIOS() {
        const newPhotoPath = this._createNewOutputFolder('iOSAssets')
        const photoList = this._readPhotoList()
        photoList.forEach(photo => {
            if (path.extname(photo) === '.svg') {
                for(let i = 1; i <= 3; i++) {
                    const multiplierName = i !== 1 ? `@${i}x` : ''
                    const photoName = path.basename(photo, '.svg') + multiplierName
                    this._generatePhoto(
                        this.inputFolderPath + photo,
                        newPhotoPath + photoName + '.png',
                        i
                    )
                }
            }
        })
    }

    _generatePhotosAndroid() {
        const newPhotoPath = this._createNewOutputFolder('AndroidAssets')
        const photoList = this._readPhotoList()
        const subFolders = [
            { name: 'drawable-ldpi', multiplier: 0.75 },
            { name: 'drawable-mdpi', multiplier: 1 },
            { name: 'drawable-hdpi', multiplier: 1.5 },
            { name: 'drawable-xhdpi', multiplier: 2 },
            { name: 'drawable-xxhdpi', multiplier: 3 },
            { name: 'drawable-xxxhdpi', multiplier: 4 }
        ]

        for (const folder of subFolders) {
            const subFolderPath = `${newPhotoPath}/${folder.name}/`
            fs.mkdirSync(subFolderPath)
            photoList.forEach(photo => {
                if (path.extname(photo) === '.svg') {
                    const photoName = path.basename(photo, '.svg')
                    this._generatePhoto(
                        this.inputFolderPath + photo,
                        subFolderPath + photoName + '.png',
                        folder.multiplier
                    )
                }
            })
        }
    }

    _generatePhoto(inputPhotoPath, outputPhotoPath, widthMultiplier) {
        const inputPhoto = sharp(inputPhotoPath)
        inputPhoto
            .metadata()
            .then(metadata => {
                return inputPhoto
                            .resize({ width: metadata.width * widthMultiplier })
                            .png()
                            .toFile(outputPhotoPath)
            })
            .then(info => {
                this._printCurrentProgress(outputPhotoPath)
            })
            .catch(error => {
                throw error
            })
    }

    _printCurrentProgress(outputPhotoPath) {
        this.currentGeneratedPhotosCount += 1
        console.log(`Done: ${this.currentGeneratedPhotosCount} / ${this.allPhotosCount} : ${outputPhotoPath}`)
    }
}

if (argvs.length !== 3) {
    console.log('Please insert your input assets directory, output directory and your platform(iOS or Android) \n' +
    'Example: node index.js ~/Documents/YOUR_INPUT_ASSET ~/Documents/YOUR_OUTPUT_ASSET ios'
    )
} else {
    assetsGenerator = new AssetsGenerator(argvs[0], argvs[1], argvs[2])
    assetsGenerator.generateAssets()
}
