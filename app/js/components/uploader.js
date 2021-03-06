class Uploader {
  constructor(assetList) {
    this.assetList = assetList
    this.fileElem = document.querySelector('#file-upload')
    this.submitUploadElem = document.querySelector('#submit-upload')
    document.addEventListener('click', this.onUploadSubmit.bind(this))
  }

  onUploadSubmit(e) {
    if (e.target.id !== this.submitUploadElem.id) return false
    if (this.fileElem.files.length === 0) return false

    const promises = []
    this.submitUploadElem.addClass('loading')

    for (let i = 0; i < this.fileElem.files.length; i++) {
      const file = this.fileElem.files[i]
      let key = this.buildS3Key(file)

      if(this.validateFileUpload(key)) {
        promises.push(App.s3Service.upload(file, key))
      } else {
        const uploaderStatusService = new AssetStatusService()
        uploaderStatusService.showError(`${file.name} exist!`)
        this.submitUploadElem.removeClass('loading')
        return false
      }
    }

    const assetStatusService = new AssetStatusService()
    Promise.all(promises)
      .then(this.onUploadSuccess.bind(this))
      .catch(assetStatusService.showError)
  }

  onUploadSuccess() {
    const uploaderStatusService = new AssetStatusService()
    uploaderStatusService.showSuccess('Upload successful!')
    this.fileElem.value = ''
    this.submitUploadElem.removeClass('loading')
    this.assetList.fetchAssets()
  }

  buildS3Key(file) {
    const fileService = new FileService()
    const date = new Date()
    let bucket = "lost_n_found"

    if (fileService.isImage(file.name)) {
      bucket = S3_IMAGES_PREFIX
    } else if (fileService.isPdf(file.name)) {
      bucket = S3_PDF_PREFIX
    }

    return `${bucket}/${date.getFullYear()}/${date.getFullMonth()}/${file.name}`
  }

  validateFileUpload(key) {
    const matchingKey = this.assetList.assets.filter(asset => {
      return asset.Key === key ? true : false
    })
    return matchingKey.length === 0 ? true : false
  }
}
