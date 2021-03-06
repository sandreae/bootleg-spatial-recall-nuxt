const aws = require('aws-sdk');

const Impulse = require('../models/Impulse');
const AppError = require('./../utils/appError');
const uploadHelpers = require('./../utils/uploadHelpers');
const catchAsync = require('./../utils/catchAsync');

const spacesEndpoint = new aws.Endpoint(
  'fra1.digitaloceanspaces.com',
);

aws.config.update({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new aws.S3();

const asyncUpload = (file) => {
  return s3
    .putObject({
      Bucket: process.env.DO_BUCKET,
      Key: file.name,
      Body: file.buffer,
      ACL: 'public-read',
    })
    .promise();
};

const asyncDelete = (url) => {
  const fileName = url.split('/').pop();
  return s3
    .deleteObject({
      Bucket: process.env.DO_BUCKET,
      Key: fileName,
    })
    .promise();
};

exports.processFiles = catchAsync(async (req, res, next) => {
  if (!req.files[0] || !req.files[1]) {
    return next(
      new AppError(
        'Please upload both and image and an audio file',
        401,
      ),
    );
  }

  for (const file of req.files) {
    if (file.mimetype.startsWith('image')) {
      req.imageFile = file;
    } else {
      req.audioFile = file;
    }
  }

  try {
    req.imageFile = await uploadHelpers.resizeImage(req.imageFile);
    req.audioFile = await uploadHelpers.compressAudio(req.audioFile);
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
  next();
});

exports.getAllImpulses = catchAsync(async (req, res, next) => {
  // This is how to use the APIfeatures
  //
  // const features = new APIFeatures(Impulse.find(), req.query)
  //   .filter()
  //   .sort()
  //   .limitFields();

  const impulses = await Impulse.find();

  res.status(200).json({
    status: 'success',
    results: impulses.length,
    impulses,
  });
});

exports.getImpulse = catchAsync(async (req, res, next) => {
  const impulse = await Impulse.findById(req.params.id);

  if (!impulse) {
    return next(new AppError('No impulse found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    impulse,
  });
});

exports.createImpulse = catchAsync(async (req, res, next) => {
  req.body.audioFile = `https://${process.env.DO_BUCKET}.${spacesEndpoint.host}/${req.audioFile.name}`;
  req.body.imageFile = `https://${process.env.DO_BUCKET}.${spacesEndpoint.host}/${req.imageFile.name}`;

  const newImpulse = await Impulse.create(req.body);
  try {
    await Promise.all(
      [req.imageFile, req.audioFile].map((file) => asyncUpload(file)),
    );
  } catch (error) {
    await Impulse.deleteImpulse(newImpulse._id);
    return new AppError('Failed to upload files', 400);
  }

  res.status(201).json({
    status: 'success',
    impulse: newImpulse,
  });
});

exports.updateImpulse = catchAsync(async (req, res, next) => {
  const impulse = await Impulse.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!impulse) {
    return next(new AppError('No impulse found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    impulse,
  });
});

exports.deleteImpulse = catchAsync(async (req, res, next) => {
  const impulse = await Impulse.findByIdAndDelete(req.params.id);

  if (!impulse) {
    return next(new AppError('No impulse found with that ID', 404));
  }

  await asyncDelete(impulse.audioFile);
  await asyncDelete(impulse.imageFile);

  res.status(204).json({});
});
