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
      post.imageUri = process.env.ASSETS_BASE_URL + data.post_filename;
    }
    if (data.profile_image_id) {
      post.profile_imageUri =
        process.env.ASSETS_BASE_URL + data.profile_filename;
    }
    allUsersPosts = [...allUsersPosts, post];
  });

  return allUsersPosts;
};

module.exports = getPostDetails;
