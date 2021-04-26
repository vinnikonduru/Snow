/**
 * External dependencies
 */
import React, { useEffect, useState, useRef } from "react";
import Tool from "../Tool";
import { nanoid } from 'nanoid';

import {
  atom,
  useSetRecoilState,
  useRecoilValue,
  selector,
  useRecoilState,
  selectorFamily,
  useRecoilValueLoadable,
  useRecoilStateLoadable,
  useRecoilCallback,
  atomFamily
} from "recoil";
import axios from "axios";

/**
 * Internal dependencies
 */
import DoenetViewer from '../../../Viewer/DoenetViewer';
import { fileByContentId } from "./Editor";
import Drive, { 
  folderDictionarySelector, 
  globalSelectedNodesAtom, 
  folderDictionary, 
  clearDriveAndItemSelections,
  fetchDrivesSelector,
  encodeParams,
  fetchDriveUsers,
  fetchDrivesQuery,
} from "../../../_reactComponents/Drive/Drive";
import ToggleButton from '../../../_reactComponents/PanelHeaderComponents/ToggleButton'
import { 
  useAssignmentCallbacks
} from "../../../_reactComponents/Drive/DriveActions";
import {
  useAssignment
} from "../../course/CourseActions";
 const viewerContentDoenetMLAtom = atom({
  key:"viewerContentDoenetMLAtom",
  default:{updateNumber:0,doenetML:""}
})
const roleAtom = atom({
  key: "roleAtom",
  default: "Instructor",
});
const loadAssignmentSelector = selectorFamily({
  key: "loadAssignmentSelector",
  get: (assignmentId) => async ({ get, set }) => {
    const { data } = await axios.get(
      `/api/getAllAssignmentSettings.php?assignmentId=${assignmentId}`
    );
    return data;
  },
});
 export const assignmentDictionary = atomFamily({
  key: "assignmentDictionary",
  default: selectorFamily({
    key: "assignmentDictionary/Default",
    get: (driveIdcourseIditemIdparentFolderId) => async (
      { get },
      instructions
    ) => {
      let folderInfoQueryKey = {
        driveId: driveIdcourseIditemIdparentFolderId.driveId,
        folderId: driveIdcourseIditemIdparentFolderId.folderId,
      };
      let folderInfo = get(folderDictionarySelector(folderInfoQueryKey));
    console.log(">>>>>>>>>>>>>>>>>>folderInfo",folderInfo)
      const itemObj =
        folderInfo?.contentsDictionary?.[
          driveIdcourseIditemIdparentFolderId.itemId
        ];
      let itemIdassignmentId = itemObj?.assignmentId
        ? itemObj.assignmentId
        : null;
      if (itemIdassignmentId) {
        const updateAssignmentInfo = await get(
          loadAssignmentSelector(itemIdassignmentId)
        );
        if (updateAssignmentInfo) {
          return updateAssignmentInfo?.assignments[0];
        } else return null;
      } else return null;
    },
  }),
});

 const AssignmentSelectorActions = Object.freeze({
  CHANGE_SETTINGS: "change settings",
  MAKE_ASSIGNMENT:"make new assignment",
  SAVE_SETTINGS: "save assignment settings",
  PUBLISH_ASSIGNMENT: "assignment was published",
  UPDATE_ASSIGNMENT: "update new assignment",
  ASSIGNMENT_TO_CONTENT: "assignment to content",
  LOAD_ASSIGNMENT: "load available assignment",

});
// const newCallbackFunction = (driveIdcourseIditemIdparentFolderId) =>{
//   console.log("@@@@@@@@@@@@@@@@@@@@@@@");
//   return (
//     assignmentDictionary(driveIdcourseIditemIdparentFolderId)
//   )
// }
let assignmentDictionarySelector = selectorFamily({
  //recoilvalue(assignmentDictionarySelector(assignmentId))
  key: "assignmentDictionarySelector",
  get: (driveIdcourseIditemIdparentFolderId) => ({ get }) => {
    return get(assignmentDictionary(driveIdcourseIditemIdparentFolderId));
  },
  set: (driveIdcourseIditemIdparentFolderId) => (
    { set, get },
    instructions
  ) => {
    let { type, ...value } = instructions;
    switch (type) {
      case AssignmentSelectorActions.CHANGE_SETTINGS:
        set(
          // newCallbackFunction(driveIdcourseIditemIdparentFolderId),
          assignmentDictionary(driveIdcourseIditemIdparentFolderId),
          (old) => {
            return { ...old, ...value };
          }
        );

        break;
        case AssignmentSelectorActions.SAVE_SETTINGS:
        const saveInfo = get(
          // newCallbackFunction(driveIdcourseIditemIdparentFolderId)
          assignmentDictionary(driveIdcourseIditemIdparentFolderId)
        );
        set(
          assignmentDictionary(driveIdcourseIditemIdparentFolderId),
          (old) => {
            return { ...old, ...value };
          }
        );
        let saveAssignmentNew = { ...saveInfo, ...value };
        set(
          assignmentDictionary(driveIdcourseIditemIdparentFolderId),
          saveAssignmentNew
        );
        const payload = {
          ...saveInfo,
          assignmentId: saveAssignmentNew.assignmentId,
          assignment_isPublished: "0",
        };

        axios.post("/api/saveAssignmentToDraft.php", payload).then((resp) => {
          console.log(resp.data);
        });
        break;
        case AssignmentSelectorActions.MAKE_ASSIGNMENT:
        
          let newAssignmentObj = {
            ...value,
            title: "Untitled Assignment",
            assignedDate: '',
            attemptAggregation: '',
            dueDate: '',
            gradeCategory: '',
            individualize: "0",
            isAssignment: "1",
            isPublished: "0",
            itemId: driveIdcourseIditemIdparentFolderId.itemId,
            multipleAttempts: '',
            numberOfAttemptsAllowed: '',
            proctorMakesAvailable: "0",
            showCorrectness: "1",
            showFeedback: "1",
            showHints: "1",
            showSolution: "1",
            timeLimit: '',
            totalPointsOrPercent: '',
            assignment_isPublished: "0",
            subType:"Administrator"
          };
          console.log(">>>>>new assignment obj",assignmentDictionary(driveIdcourseIditemIdparentFolderId),newAssignmentObj);
          set(assignmentDictionary(driveIdcourseIditemIdparentFolderId),newAssignmentObj);
          break;
        case AssignmentSelectorActions.PUBLISH_ASSIGNMENT:
        // console.log(">>>> published value", value.assignedData.branchId);
        let publishAssignment = get(
          assignmentDictionary(driveIdcourseIditemIdparentFolderId)
        );

        set(
          assignmentDictionary(driveIdcourseIditemIdparentFolderId),
          publishAssignment
        );
        const payloadPublish = {
          ...publishAssignment,
          assignmentId: publishAssignment.assignmentId,
          assignment_isPublished: "1",
          branchId:value.assignedData.branchId,
          courseId: driveIdcourseIditemIdparentFolderId.courseId,
        };
        axios
          .post("/api/publishAssignment.php", payloadPublish)
          .then((resp) => {
            console.log(resp.data);
          });
        break;
        case AssignmentSelectorActions.UPDATE_ASSIGNMENT:
        let editAssignment = get(
          assignmentDictionary(driveIdcourseIditemIdparentFolderId)
        );

        set(
          assignmentDictionary(driveIdcourseIditemIdparentFolderId),
          editAssignment
        );

        break;
        case AssignmentSelectorActions.ASSIGNMENT_TO_CONTENT:
        let handlebackContent = get(
          assignmentDictionary(driveIdcourseIditemIdparentFolderId)
        );

        const payloadContent = {
          ...handlebackContent,
          isAssignment: 0,
        };
        set(
          assignmentDictionary(driveIdcourseIditemIdparentFolderId),
          payloadContent
        );

        break;
        case AssignmentSelectorActions.LOAD_ASSIGNMENT:
        let handlebackAssignment = get(
          assignmentDictionary(driveIdcourseIditemIdparentFolderId)
        );

        const payloadAssignment = {
          ...handlebackAssignment,
          isAssignment: 1,
        };
        set(
          assignmentDictionary(driveIdcourseIditemIdparentFolderId),
          payloadAssignment
        );

        break;
    }
  },
});

 const ContentInfoPanel = (props) => {
   
   
  const { addContentAssignment ,changeSettings, saveSettings,publishContentAssignment, onAddAssignmentError } = useAssignment();
  const { publishAssignment, 
    onPublishAssignmentError,
    publishContent,
    onPublishContentError,
    updateAssignmentTitle,
    onUpdateAssignmentTitleError,
    convertAssignmentToContent,
    onConvertAssignmentToContentError } = useAssignmentCallbacks();


  console.log(">>>content info  props", props);
  let courseId = props.courseId;
  let itemId = props.itemId;
  let itemType = props.itemType;
  let assignmentId = "";
  let driveId = props.driveId;
  let folderId = props.folderId;
  let branchId = props.branchId;
  let contentId = props.contentId;

  // const { publishAssignment, onPublishAssignmentError } = useAssignmentCallbacks();
  // const { publishContent, onPublishContentError } = useAssignmentCallbacks();
  // const { updateAssignmentTitle, onUpdateAssignmentTitleError } = useAssignmentCallbacks();
  // const { convertAssignmentToContent, onConvertAssignmentToContentError } = useAssignmentCallbacks();

  const [role, setRole] = useRecoilState(roleAtom);
  const [updateAssignmentInfo,setAssignmentForm] = useRecoilState(assignmentDictionary({itemId: itemId,
    courseId: courseId,
    driveId: driveId,
    folderId: folderId,
    contentId:contentId,
    branchId:branchId
  }));

  const setAssignmentSettings = useSetRecoilState(  //TODO Remove
    assignmentDictionarySelector({
      itemId: itemId,
      courseId: courseId,
      driveId: driveId,
      folderId: folderId,
      contentId:contentId
    })
  );
  const [folderInfoObj, setFolderInfo] = useRecoilStateLoadable(
    folderDictionarySelector({ driveId: driveId, folderId: folderId })
  );
  
  // console.log(">>>> folderInfoObj",folderInfoObj);
  // if(folderInfoObj?.state === "hasValue"){
  //   console.log(">>>> folderInfoObj",folderInfoObj);

  // let itemInfo = folderInfoObj?.contents?.contentsDictionary[itemId];
  //   if (itemInfo?.itemType === "DoenetML"){
  //     branchId = itemInfo.branchId;
  //   }
  // }
  const [makeNewAssignment, setMakeNewAssignment] = useState(false);


  // if (assignmentIdSettings?.state === "hasValue") {   
  //   updateAssignmentInfo = assignmentIdSettings?.contents;
  //   console.log(">>>updateAssignmentInfo",updateAssignmentInfo);
  //   if (updateAssignmentInfo?.assignmentId) {
  //     assignmentId = updateAssignmentInfo?.assignmentId;
  //     setAssignmentSettings({ type: "update new assignment", updateAssignmentInfo });
  //   }
  // }

  //  const handleMakeAssignment = () => {
  //   setMakeNewAssignment(true);
  // };
  // if (
  //   makeNewAssignment &&
  //   (assignmentId === "" || assignmentId === undefined)
  // ) {
  //   assignmentId = nanoid(); // This is to generate a new one

  //   setAssignmentSettings({
  //     type: "make new assignment",
  //     assignmentId: assignmentId,
  //   });
  //   let payload = {
  //     assignmentId,
  //     itemId,
  //     courseId,
  //     branchId,
  //     contentId
  //   };
  //   setMakeNewAssignment(false);
  //   axios.post(`/api/makeNewAssignment.php`, payload).then((response) => {
  //     console.log(response.data);
  //   });
  // }


   const handlePublishContent = () => {
    let payload = {
      itemId: itemId,
    };
    publishContent({
      driveIdFolderId:{
        driveId: driveId,
        folderId: folderId,
      },
      itemId: itemId,
      payload: payload,
    })

    axios.post(`/api/handlePublishContent.php`, payload).then((response) => {
      console.log(response.data);
    });
  };

  const [makecontent, setMakeContent] = useState(false);

  const handleMakeContent = (e) => {
    setMakeContent(true);
  };

  if (makecontent) {
    let payload = {
      itemId: itemId,
    };
    setMakeContent(false);
    axios.post(`/api/handleMakeContent.php`, payload).then((response) => {
      console.log(response.data);
    });
    setAssignmentSettings({ type: "assignment to content", updateAssignmentInfo });   // TODO
    
    convertAssignmentToContent({
      driveIdFolderId:{
        driveId: driveId,
        folderId: folderId,
      },
      itemId: itemId,
      assignedDataSavenew: payload,
    })

  }

  const loadBackAssignment = () => {
    let payload = {
      itemId: itemId,
    };
    axios.post(`/api/handleBackAssignment.php`, payload).then((response) => {
      console.log(response.data);
    });
    setAssignmentSettings({                                                          // TODO
      type: "load available assignment",
      updateAssignmentInfo,
    });
    // setFolderInfo({                                            //TODO
    //   instructionType: "assignment title update",
    //   itemId: itemId,
    //   payloadAssignment: updateAssignmentInfo,
    // });
  };
   const AssignmentForm = (props) => {
    let courseId = props.courseId;
    let itemType = props.itemType;
    let assignmentId = props.updateAssignmentInfo.assignmentId;
    let itemId = props.itemId;
    let driveId = props.driveId;
    let folderId = props.folderId;
    // let branchId = props.branchId;
    let updateAssignmentInfo = props.updateAssignmentInfo;
  
    const role = useRecoilValue(roleAtom);
  
    const setAssignmentSettings = useSetRecoilState(
      assignmentDictionarySelector({
        itemId: itemId,
        courseId: courseId,
        driveId: driveId,
        folderId: folderId,
      })
    );
    const [folderInfoObj, setFolderInfo] = useRecoilStateLoadable(
      folderDictionarySelector({ driveId: driveId, folderId: folderId })
    );
    let branchId = '';
      if(folderInfoObj?.state === "hasValue"){
   
      let itemInfo = folderInfoObj?.contents?.contentsDictionary[itemId];
        if (itemInfo?.itemType === "DoenetML"){
          branchId = itemInfo.branchId;
        }
      }
  
   
    const handleChange = (event) => {
      event.preventDefault();
      let name = event.target.name;
      let value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
          setAssignmentForm((old)=>{
            console.log(">!!!!!!!!!!here@@@@@@@@@@@!!!!!",{ ...old, [name]:value});
            return  {   ...old,  [name]:value }  
          } )
      const result = changeSettings({
        [name]: value,
        driveIdcourseIditemIdparentFolderId: {
          driveId: driveId, 
          folderId: folderId,
          itemId:itemId,
          courseId:courseId,
          branchId:branchId,
          contentId:contentId},
      });
      result.then((resp)=>{
        if (resp.data.success){
          // addToast(`Renamed item to '${newLabel}'`, ToastType.SUCCESS);
        }else{
          // onRenameItemError({errorMessage: resp.data.message});
        }
      }).catch((e)=>{
        // onRenameItemError({errorMessage: e.message});
      })
      
      // setAssignmentSettings({ type: "change settings", [name]: value });   // TODO
    };
    const handleOnBlur = (e) => {
      let name = e.target.name;
      let value =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;

        setAssignmentForm((old)=>{
          return  {   ...old,  [name]:value }  
        })

        const result = saveSettings({
          [name]: value,
          driveIdcourseIditemIdparentFolderId: {
            driveId: driveId, 
            folderId: folderId,
            itemId:itemId,
            courseId:courseId,
            branchId:branchId,
            contentId:contentId},
        });
      // setAssignmentSettings({ type: "save assignment settings", [name]: value });    // TODO
    };
  
    // const handleSubmit = (e) => {
    //   const payload = {
    //     ...updateAssignmentInfo,
    //     assignmentId: assignmentId,
    //     assignment_isPublished: "1",
    //     courseId: courseId,
    //     branchId:branchId
    //   };
    //   const result = publishContentAssignment(payload);
    //   result.then((resp)=>{
    //     if (resp.data.success){
    //       // addToast(`Renamed item to '${newLabel}'`, ToastType.SUCCESS);
    //     }else{
    //       // onRenameItemError({errorMessage: resp.data.message});
    //     }
    //   }).catch((e)=>{
    //     // onRenameItemError({errorMessage: e.message});
    //   })
    //   // setFolderInfo({                                            TODO
    //   //   instructionType: "assignment was published",
    //   //   itemId: itemId,
    //   //   payload: payload,
    //   // });
    // };
  
    return role === "Instructor" ? (
      <>
        { (
          <>
            <div>
              <label>Assignment Name :</label>
              <input
                required
                type="text"
                name="title"
                value={updateAssignmentInfo ? updateAssignmentInfo?.title :''}
                placeholder="Title goes here"
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Assigned Date:</label>
              <input
                required
                type="text"
                name="assignedDate"
                value={updateAssignmentInfo ? updateAssignmentInfo?.assignedDate : ''  }
                placeholder="0001-01-01 01:01:01 "
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Due date: </label>
              <input
                required
                type="text"
                name="dueDate"
                value={ updateAssignmentInfo ? updateAssignmentInfo?.dueDate  : ''}
                placeholder="0001-01-01 01:01:01"
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
  
            <div>
              <label>Time Limit:</label>
              <input
                required
                type="time"
                name="timeLimit"
                value={ updateAssignmentInfo ? updateAssignmentInfo?.timeLimit  : ''}
                placeholder="01:01:01"
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Number Of Attempts:</label>
              <input
                required
                type="number"
                name="numberOfAttemptsAllowed"
                value={ updateAssignmentInfo ? updateAssignmentInfo?.numberOfAttemptsAllowed  : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Attempt Aggregation :</label>
              <input
                required
                type="text"
                name="attemptAggregation"
                value={ updateAssignmentInfo ? updateAssignmentInfo?.attemptAggregation  : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Total Points Or Percent: </label>
              <input
                required
                type="number"
                name="totalPointsOrPercent"
                value={ updateAssignmentInfo ? updateAssignmentInfo?.totalPointsOrPercent  : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Grade Category: </label>
              <input
                required
                type="select"
                name="gradeCategory"
                value={ updateAssignmentInfo ? updateAssignmentInfo?.gradeCategory  : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Individualize: </label>
              <input
                required
                type="checkbox"
                name="individualize"
                value={updateAssignmentInfo ?  updateAssignmentInfo?.individualize  : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Multiple Attempts: </label>
              <input
                required
                type="checkbox"
                name="multipleAttempts"
                value={ updateAssignmentInfo ? updateAssignmentInfo?.multipleAttempts  : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Show solution: </label>
              <input
                required
                type="checkbox"
                name="showSolution"
                value={ updateAssignmentInfo ? updateAssignmentInfo?.showSolution  : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Show feedback: </label>
              <input
                required
                type="checkbox"
                name="showFeedback"
                value={ updateAssignmentInfo ? updateAssignmentInfo?.showFeedback  : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Show hints: </label>
              <input
                required
                type="checkbox"
                name="showHints"
                value={ updateAssignmentInfo ? updateAssignmentInfo?.showHints  : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Show correctness: </label>
              <input
                required
                type="checkbox"
                name="showCorrectness"
                value={updateAssignmentInfo ? updateAssignmentInfo?.showCorrectness  : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Proctor make available: </label>
              <input
                required
                type="checkbox"
                name="proctorMakesAvailable"
                value={ updateAssignmentInfo ? updateAssignmentInfo?.proctorMakesAvailable : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <ToggleButton
                value="Publish assignment"
                switch_value="publish changes"
                callback={()=>{
                  const payload = {
                    ...updateAssignmentInfo,
                    assignmentId: assignmentId,
                    assignment_isPublished: "1",
                    courseId: courseId,
                    branchId:branchId
                  };
                  const result = publishContentAssignment(payload);
                  // if(result){
                  //   setAssignmentForm(result);
                  // }
                  result.then(resp => {
                    if (resp){
                      // addToast(`Add new assignment 'Untitled assignment'`, ToastType.SUCCESS);
                      setAssignmentForm(resp)
                    }
                    // else{
                    //   onAddAssignmentError({errorMessage: resp.data.message});
                    // }
                  })
                  // .catch( e => {
                  //   onAddAssignmentError({errorMessage: e.message});
                  // })
                }
                }
                type="submit"
              ></ToggleButton>
            </div>
            <div></div>
          </>
        )}
      </>
    ) : (
      <div>
        {assignmentId && (
          <div>
            <h1>{updateAssignmentInfo?.title}</h1>
            <p>Due: {updateAssignmentInfo?.dueDate}</p>
            <p>Time Limit: {updateAssignmentInfo?.timeLimit}</p>
            <p>
              Number of Attempts Allowed:{" "}
              {updateAssignmentInfo?.numberOfAttemptsAllowed}
            </p>
            <p>Points: {updateAssignmentInfo?.totalPointsOrPercent}</p>
          </div>
        )}
      </div>
    );
  };
  return (
    <div>
      <br />

      {role === "Instructor" &&
        updateAssignmentInfo?.assignment_isPublished !== "1" && (
          <ToggleButton
            value="Publish Content"
            switch_value="Published"
            callback={handlePublishContent}
          />
        )}

      {role === "Instructor" ? (
        <ToggleButton value="Make Assignment" callback={()=>{
          assignmentId = nanoid();
          const result = addContentAssignment({
            driveIdcourseIditemIdparentFolderId: {driveId: driveId, folderId: folderId,itemId:itemId,courseId:courseId,branchId:branchId,contentId:contentId},
             assignmentId: assignmentId            
          });
          // if(result){
          //   setAssignmentForm(result);
          // }
          result.then(resp => {
            if (resp){
              // addToast(`Add new assignment 'Untitled assignment'`, ToastType.SUCCESS);
              setAssignmentForm(resp)
            }
            // else{
            //   onAddAssignmentError({errorMessage: resp.data.message});
            // }
          })
          // .catch( e => {
          //   onAddAssignmentError({errorMessage: e.message});
          // })
        }
        } />
      ) 
      : null}
      <br />
      {/* {console.log(">>>>>>>>>>>>>updateAssignmentInfoupdateAssignmentInfoupdateAssignmentInfo",updateAssignmentInfo)} */}
      {updateAssignmentInfo?.isAssignment == "1" && (
        <AssignmentForm
          itemType={itemType}
          courseId={courseId}
          driveId={driveId}
          folderId={folderId}
          branchId={branchId}
          assignmentId={assignmentId}
          updateAssignmentInfo={updateAssignmentInfo}
          itemId={itemId}
        />
      )}

      {/* {role === "Instructor" && updateAssignmentInfo?.isAssignment == "1" && (
        <ToggleButton value="Make Content" callback={handleMakeContent} />
      )} */}

      {role === "Instructor" &&
      assignmentId &&
      updateAssignmentInfo?.isAssignment == "0" ? (
        <ToggleButton value="back Assignment" callback={loadBackAssignment} />
      ) : null}
    </div>
  );
};

export default function Content({ branchId = '',contentId ='',title,courseId = '',driveId='' ,folderId='',itemId=''}) {

  let initDoenetML = useRecoilCallback(({snapshot,set})=> async (contentId)=>{
    const response = await snapshot.getPromise(fileByContentId(contentId));
    const doenetML = response.data;
    const viewerObj = await snapshot.getPromise(viewerContentDoenetMLAtom);
    const updateNumber = viewerObj.updateNumber+1;
    set(viewerContentDoenetMLAtom,{updateNumber,doenetML})
  })

  useEffect(() => {
    initDoenetML(contentId ? contentId : branchId)
}, []);

// const viewerDoenetML = useRecoilValue(viewerContentDoenetMLAtom);

function DoenetViewerPanel(){
  const viewerDoenetML = useRecoilValue(viewerContentDoenetMLAtom);


  let attemptNumber = 1;
  let requestedVariant = { index: attemptNumber }
  let assignmentId = "myassignmentid";
  let solutionDisplayMode = "button";
  
  return <DoenetViewer
      key={"doenetviewer" + viewerDoenetML?.updateNumber}
      doenetML={viewerDoenetML?.doenetML}
      flags={{
        showCorrectness: true,
        readOnly: false,
        solutionDisplayMode: solutionDisplayMode,
        showFeedback: true,
        showHints: true,
      }}
      attemptNumber={attemptNumber}
      assignmentId={assignmentId}
      ignoreDatabase={true}
      requestedVariant={requestedVariant}
      /> 
}
  return (
    <Tool>
      <headerPanel title={title}>
      </headerPanel>

      <mainPanel>
      <div style={{overflowY:"scroll", height:"calc(100vh - 84px)" }}><DoenetViewerPanel /></div>
    
      </mainPanel>
      <menuPanel title="Content Info" isInitOpen>
       {(
          <ContentInfoPanel
            branchId={branchId}
            contentId={contentId ? contentId : branchId}
            itemType={"DoenetML"}
            courseId={courseId}
            driveId={driveId}
            folderId={folderId}
            itemId={itemId}
                      />
        )}

       </menuPanel>

    </Tool>
  );
}

