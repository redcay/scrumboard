if (Meteor.isClient) {
  Template.newStoryDialog.events = {
    'click .add-story': function() {
      var sprint = getSprint();
      var $form = $('form.add-story-form');
      var storyName = $form.find('#story-name').val();
      var storyPoints = Number($form.find('#story-points').val());
      var storyDescription = $form.find('#story-description').val();
      var storyAcceptanceCriteria = $form.find('#story-acceptance-criteria').val();
      if (storyName && storyPoints && storyDescription && storyAcceptanceCriteria) {
        var newStory = {
          name: storyName,
          points: storyPoints,
          description: storyDescription,
          acceptanceCriteria: storyAcceptanceCriteria,
          tasks: [],
          nextTaskId: 0
        };
        var storyId = Stories.insert(newStory);
        Sprints.update(
          {_id: sprint._id},
          {stories: {$push: {
            id: storyId,
            name: storyName
          }}});
        $('#add-story-dialog').modal('hide');
      } else {
        alert('All fields required');
      }
    }
  }

  Template.newTaskDialog.events = {
    'click .add-task': function() {
      var sprint = getSprint();
      var $form = $('form.add-task-form');
      var taskName = $form.find('#task-name').val();
      var taskOwner = $form.find('#task-owner').val();
      var taskHours = Number($form.find('#task-hours').val());
      var taskDescription = $form.find('#task-description').val();
      var taskStatus = $form.find('#task-status').val();
      var storyId = $form.find('#story-id').val();
      var taskId = $form.find('#task-id').val();
      if (taskName && taskOwner && taskHours && taskDescription && taskStatus) {
        var story = getStory(storyId);
        if (taskId) {
          var task = getTask(story, taskId);
          task.name = taskName;
          task.owner = taskOwner;
          task.hours = taskHours;
          task.description = taskDescription;
          task.status = taskStatus;
          Session.set(UPDATED_TASK, task.id);
          Stories.update(
            {_id: story._id},
            {$set: {tasks: story.tasks}});
        } else {
          var newTask = {
            name: taskName,
            owner: taskOwner,
            hours: taskHours,
            description: taskDescription,
            status: taskStatus,
            id: story.nextTaskId
          };
          Session.set(UPDATED_TASK, newTask.id);
          Stories.update(
            {_id: story._id},
            {$push: {tasks: newTask}, $inc: {nextTaskId: 1}});
        }
        $('#add-task-dialog').modal('hide');
      } else {
        alert('All fields required');
      }
    }
  }
}