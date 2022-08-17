import ReactDOM from 'react-dom';
import React, {useEffect,useState, useRef} from 'react';

function Info() {
    const size: Size = useWindowSize();
    return (
      <div>
        {size.width}px / {size.height}px
      </div>
    );
  }


  interface Size {
    width: number | undefined;
    height: number | undefined;
}

function useWindowSize():Size{
    const [windowSize, setWindowSize] = useState<Size>({
        width: undefined,
        height: undefined,
      });

      useEffect(() => {
        // Handler to call on window resize
        function handleResize() {
          // Set window width/height to state
          setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight-100,
          });
        }

        // Add event listener
        window.addEventListener("resize", handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleResize);
      }, []); // Empty array ensures that effect is only run on mount
      return windowSize;
}

export default Info;