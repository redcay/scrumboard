Meteor.methods({
  addSprint: function(sprint) {
    if (!sprint.name || !sprint.days) {
      throw new Meteor.Error(0, 'Name and days required');
    } else if (getSprintByName(sprint.name)) {
      throw new Meteor.Error(0, 'Sprint with name "' + sprint.name + '" already exists');
    }
    var sprintId = Sprints.insert(sprint);
    return sprintId;
  },

  editSprintName: function(sprintId, name) {
    if (!name) {
      throw new Meteor.Error(0, 'Name required');
    } else {
      var existingSprint = getSprintByName(name);
      if (existingSprint) {
        if (existingSprint._id != sprintId) {
          throw new Meteor.Error(0, 'Sprint with name "' + name + '" already exists');
        }
      } else {
        Sprints.update(
          {_id: sprintId},
          {
            $set: {
              name: name
            }
          });
      }
    }
  },

  setSprintHoursRemainingPerDay: function(sprintId, hoursRemainingPerDay) {
    Sprints.update({_id: sprintId}, {$set: {hoursRemainingPerDay: hoursRemainingPerDay}});
  },

  /** 
   * If given task has no ID or task ID is story's nextTaskId, insert into story.
   * If given task has ID, updates the specified task in the story.
   * In addition, update story hours/hours remaining.
   */
  upsertTask: function(task, storyId) {
    var hoursDelta;
    var hoursRemainingDelta;
    var story = getStory(storyId);
    var updated = false;
    if (task.id == null || task.id == story.nextTaskId) {
      task.id = story.nextTaskId;
      story.nextTaskId++;
      story.tasks.push(task);
      hoursDelta = task.hours;
      hoursRemainingDelta = task.hoursRemaining;
      updated = true;
    } else {
      for (var ii = 0, len = story.tasks.length; ii < len; ii++) {
        var oldTask = story.tasks[ii];
        if (oldTask.id == task.id) {
          hoursDelta = task.hours - oldTask.hours;
          hoursRemainingDelta = task.hoursRemaining - oldTask.hoursRemaining;
          story.tasks[ii] = task;
          updated = true;
          break;
        }
      }
    }
    if (updated) {
      Stories.update(
        {_id: story._id},
        {
          $set: {
            tasks: story.tasks,
            nextTaskId: story.nextTaskId
          },
          $inc: {
            totalHours: hoursDelta,
            hoursRemaining: hoursRemainingDelta
          }
        });
    }
  },

  deleteTask: function(taskId, storyId) {
    var story = getStory(storyId);
    for (var ii = 0, len = story.tasks.length; ii < len; ii++) {
      if (story.tasks[ii].id == taskId) {
        var taskHours = story.tasks[ii].hours;
        var taskHoursRemaining = story.tasks[ii].hoursRemaining;
        story.tasks.splice(ii, 1);
        Stories.update(
          {_id: story._id},
          {
            $set: {tasks: story.tasks},
            $inc: {
              totalHours: -taskHours,
              hoursRemaining: -taskHoursRemaining  
            }
          });
        break;
      }
    }
  },

  addStory: function(story) {
    var storyId = Stories.insert(story);
    return storyId;
  },

  updateStory: function(storyId, storyName, storyPoints, storyDescription, storyAcceptanceCriteria) {
    Stories.update(
      {_id: storyId},
      {
        $set: {
          name: storyName,
          points: storyPoints,
          description: storyDescription,
          acceptanceCriteria: storyAcceptanceCriteria
        }
      });
  },

  addStories: function(stories) {
    for (var ii = 0, len = stories.length; ii < len; ii++) {
      var story = stories[ii];
      Stories.insert(story);
    }
  },

  deleteStory: function(storyId) {
    Stories.remove({_id: storyId});
  },

  deleteSprint: function(sprintId) {
    Sprints.remove({_id: sprintId});
    Stories.remove({sprintId: sprintId});
  }
});