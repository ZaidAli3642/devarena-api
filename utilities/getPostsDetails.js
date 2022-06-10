const getPostDetails = (data, likeData, dislikeData, user_id) => {
  let allUsersPosts = [];

  data.map((data) => {
    const post = {
      post_id: data.post_id,
      description: data.description,
      created_at: data.created_at,
      firstname: data.firstname,
      lastname: data.lastname,
      user_id: data.user_id,
      post_filename: data.post_filename,
      post_filepath: data.post_filepath,
      post_mimetype: data.post_mimetype,
      post_size: data.post_size,
      post_type: data.post_type,
      shared_user_id: data.shared_user_id,
      comments: [],
    };

    likeData.forEach((like) => {
      if (data.post_id === like.post_id) {
        if (like.user_id === parseInt(user_id)) {
          post.like_post = true;
        }
      }
    });

    dislikeData.forEach((dislike) => {
      if (
        data.post_id === dislike.post_id &&
        dislike.user_id === parseInt(user_id)
      ) {
        post.dislike_post = true;
      }
    });

    if (data.image_id) {
      post.imageUri = data.post_imageurl;
    }
    if (data.profile_image_id) {
      post.profile_imageUri = data.profile_imageurl;
    }
    allUsersPosts = [...allUsersPosts, post];
  });

  return allUsersPosts;
};

module.exports = getPostDetails;
