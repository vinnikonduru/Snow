/**
 * External dependencies
 */
import React, { useState,useEffect }  from 'react';

/**
 * Internal dependencies
 */
import Tool from '../_framework/Tool';
import DoenetViewer from '../../Viewer/DoenetViewer.jsx';
import { 
  useRecoilValue, 
  useRecoilCallback,
  atom, 
} from "recoil";
import {fileByContentId} from '../_framework/Overlays/Editor';

const contentDoenetMLAtom = atom({
  key:"contentDoenetMLAtom",
  default:{updateNumber:0,doenetML:""}
})

export default function Content(props) {
  console.log("props", props);
  let urlParamsObj = Object.fromEntries(new URLSearchParams(props.route.location.search));      //TODO
  let newParams = {...urlParamsObj} 


  let initDoenetML = useRecoilCallback(({snapshot,set})=> async (contentId)=>{
    const response = await snapshot.getPromise(fileByContentId(contentId));
    const doenetML = response.data;
    const viewerObj = await snapshot.getPromise(contentDoenetMLAtom);
    const updateNumber = viewerObj.updateNumber+1;
    set(contentDoenetMLAtom,{updateNumber,doenetML})
  })

  useEffect(() => {                         
    initDoenetML(newParams.contentId)
 }, []);

 const viewerDoenetML = useRecoilValue(contentDoenetMLAtom);

  const [attemptNumber,setAttemptNumber] = useState(1);
  const [updateNumber,setUpdateNumber] = useState(1);
  const showCorrectness = true;
  const readOnly = false;
  const solutionDisplayMode = "button";
  const showFeedback = true;
  const showHints = true;
  const ignoreDatabase = true;
  const requestedVariant = {index:1}; 
  return (
    
    <Tool>
      <headerPanel title="Content">

      </headerPanel>
       <mainPanel>

         <p>DoenetViewer</p>
         {newParams.contentId ? <DoenetViewer
          key={'doenetviewer' + viewerDoenetML?.updateNumber}
          doenetML={viewerDoenetML?.doenetML}
          flags={{
            showCorrectness,
            readOnly,
            solutionDisplayMode,
            showFeedback,
            showHints,
          }}
          attemptNumber={attemptNumber}
          ignoreDatabase={ignoreDatabase}
          requestedVariant={requestedVariant}
        /> : <p>Need a contentId to display content...!</p>}
       </mainPanel>
    </Tool>



 
  );
}