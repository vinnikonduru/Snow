/**
 * External dependencies
 */
import React from 'react';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { useRecoilCallback } from 'recoil';

/**
 * Internal dependencies
 */

import { assignmentDictionary } from '../course/Course';
import Toast, { useToast } from '../../Tools/_framework/Toast';

export const useAssignment = () => {
  const [addToast, ToastType] = useToast();

  const addContentAssignment = useRecoilCallback(
    ({ snapshot, set }) => async (props) => {
      let { driveIdcourseIditemIdparentFolderId, assignmentId ,contentId,branchId} = props;

      // assignment creation
      let newAssignmentObj = {
        assignmentId: assignmentId,
        assignment_title: 'Untitled Assignment',
        assignedDate: '',
        attemptAggregation: '',
        dueDate: '',
        gradeCategory: '',
        individualize: '0',
        isAssignment: '1',
        isPublished: '0',
        itemId: driveIdcourseIditemIdparentFolderId.itemId,
        multipleAttempts: '',
        numberOfAttemptsAllowed: '',
        proctorMakesAvailable: '0',
        showCorrectness: '1',
        showFeedback: '1',
        showHints: '1',
        showSolution: '1',
        timeLimit: '',
        totalPointsOrPercent: '',
        assignment_isPublished: '0',
        subType: 'Administrator',
      };

      let payload = {
        assignmentId: assignmentId,
        itemId: driveIdcourseIditemIdparentFolderId.itemId,
        courseId: driveIdcourseIditemIdparentFolderId.courseId,
        branchId: branchId,
        contentId: contentId,
      };
      set(assignmentDictionary(driveIdcourseIditemIdparentFolderId), newAssignmentObj);

      axios.post(`/api/makeNewAssignment.php`, payload).then((response) => {
        // set(assignmentDictionary, newAssignmentObj);
        console.log(response.data);
      });

      // set(
      //   assignmentDictionary(driveIdcourseIditemIdparentFolderId),
      //   newAssignmentObj,
      // );

      return newAssignmentObj;
    },
  );

  const changeSettings = useRecoilCallback(
    ({ snapshot, set }) => async (props) => {
      let { driveIdcourseIditemIdparentFolderId, ...value } = props;
      set(assignmentDictionary(driveIdcourseIditemIdparentFolderId), (old) => {
        return { ...old, ...value };
      });
    },
  );

  const saveSettings = useRecoilCallback(
    ({ snapshot, set }) => async (props) => {
      let { driveIdcourseIditemIdparentFolderId, ...value } = props;

      const saveInfo = await snapshot.getPromise(assignmentDictionary(driveIdcourseIditemIdparentFolderId));
      set(assignmentDictionary(driveIdcourseIditemIdparentFolderId), (old) => {
        return { ...old, ...value };
      });
      let saveAssignmentNew = { ...saveInfo, ...value };
      set(assignmentDictionary(driveIdcourseIditemIdparentFolderId), saveAssignmentNew);
      const payload = {
        ...saveInfo,
        assignmentId: saveAssignmentNew.assignmentId,
        assignment_isPublished: '0',
      };

      axios.post('/api/saveAssignmentToDraft.php', payload).then((resp) => {
        console.log(resp.data);
      });
    },
  );

  const publishContentAssignment = useRecoilCallback(
    ({ snapshot, set }) => async (props) => {
      let { driveIdcourseIditemIdparentFolderId, ...value } = props;
      const publishAssignment = await snapshot.getPromise(assignmentDictionary(driveIdcourseIditemIdparentFolderId));

      set(assignmentDictionary(driveIdcourseIditemIdparentFolderId),publishAssignment
      );
      const payloadPublish = {
        ...value,
        assignmentId: props.assignmentId,
        assignment_isPublished: '1',
        branchId: props.branchId,
        courseId: props.courseId,
      };
      axios.post('/api/publishAssignment.php', payloadPublish).then((resp) => {
        console.log(resp.data);
      });
    },
  );

  const updateexistingAssignment = useRecoilCallback(
    ({ snapshot, set }) => async (props) => {
      let { driveIdcourseIditemIdparentFolderId, ...value } = props;
      let editAssignment = get(assignmentDictionary);
      set(assignmentDictionary(driveIdcourseIditemIdparentFolderId), editAssignment);
    },
  );

  const assignmentToContent = useRecoilCallback(({ snapshot, set }) => async (props) => {
      let { driveIdcourseIditemIdparentFolderId, ...value } = props;
      const handlebackContent = await snapshot.getPromise(assignmentDictionary(driveIdcourseIditemIdparentFolderId));
      const payloadContent = { ...handlebackContent, isAssignment: 0 };
      set(assignmentDictionary(driveIdcourseIditemIdparentFolderId), payloadContent);
    },
  );
  const loadAvailableAssignment = useRecoilCallback(({ snapshot, set }) => async (props) => {
      let { driveIdcourseIditemIdparentFolderId, ...value } = props;
      const handlebackAssignment = await snapshot.getPromise(assignmentDictionary(driveIdcourseIditemIdparentFolderId));
      const payloadAssignment = { ...handlebackAssignment, isAssignment: 1 };
      set(assignmentDictionary(driveIdcourseIditemIdparentFolderId), payloadAssignment);
    },
  );

  const onAssignmentError = ({ errorMessage = null }) => {
    addToast(`${errorMessage}`, ToastType.ERROR);
  };
  return {
    addContentAssignment,
    changeSettings,
    saveSettings,
    publishContentAssignment,
    updateexistingAssignment,
    assignmentToContent,
    loadAvailableAssignment,
    onAssignmentError,
  };
};
