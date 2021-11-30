const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');
const sanitize = require('mongo-sanitize');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;

    function escape(html) {
      return html.replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
    };

    const cleanTitle = escape(title);
    const cleanAuthor = escape(author);

    const file = req.files.file;
    const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
    const fileExt = fileName.split('.').slice(-1)[0];

    if(cleanTitle && cleanAuthor && email.includes('@') && file && (fileExt === 'jpg' || fileExt === 'gif' || fileExt === 'png')) {
      const newPhoto = new Photo({ title: cleanTitle, author: cleanAuthor, email, src: fileName, votes: 0 });
      await newPhoto.save();
      res.json(newPhoto);
    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const voterIP = req.clientIp;
    const voter = await Voter.findOne({ user: voterIP })

    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      if (!voter) {
        const newVoter = new Voter({ user: voterIP, votes: req.params.id });
        await newVoter.save();

        photoToUpdate.votes++;
        await photoToUpdate.save();
      }
      else {
        if (!voter.votes.includes(req.params.id)) {
          voter.votes.push(req.params.id);
          await voter.save();
          
          photoToUpdate.votes++;
          await photoToUpdate.save();
        }
        else throw new Error('You have already voted for that picture!');
      }
      res.send({ message: 'OK' });
    }
  }
  catch(err) {
    res.status(500).json(err);
  }
};
