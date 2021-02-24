const mongoose = require('mongoose');
const slugify = require('slugify');
const ObjectID = require('mongodb').ObjectID;

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

const impulseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'An impulse must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'An impulse name must have less or equal then 40 characters',
      ],
      minlength: [
        4,
        'An impulse name must have more or equal then 4 characters',
      ],
    },
    slug: String,
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: [
        function () {
          return this.gpsLocation == null;
        },
        'Either location or GPS position must be provided',
      ],
    },
    gpsLocation: {
      type: pointSchema,
      required: [
        function () {
          return this.location == null;
        },
        'Either location or GPS position must be provided',
      ],
    },
    description: {
      type: String,
      required: true,
    },
    audioUrl: {
      type: String,
      required: [
        true,
        'An audio sample must be uploaded with each impulse entry',
      ],
    },
    imageUrl: {
      type: String,
      required: [
        true,
        'An image must be uploaded with each impulse entry',
      ],
    },
  },
  { timestamps: true },
);

impulseSchema.statics.addImpulse = async function (impulse) {
  const Impulse = new this(impulse);
  const result = await Impulse.save(impulse);
  return result;
};

impulseSchema.statics.listImpulses = async function () {
  return await this.find();
};

impulseSchema.statics.deleteImpulse = async function (_id) {
  console.log(_id);
  return await this.deleteOne({ _id: ObjectID(_id) });
};

impulseSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

module.exports = mongoose.model('impulse', impulseSchema);
