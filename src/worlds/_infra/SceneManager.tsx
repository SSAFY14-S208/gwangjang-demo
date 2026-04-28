import { LandingScene } from '../landing'
import { MyRoomScene } from '../myroom'
import { useSceneStore } from '@/shared/store'

/**
 * SceneManager — 씬 전환·로딩 상태를 중앙 관리합니다.
 */
export default function SceneManager() {
  const currentScene = useSceneStore((s) => s.currentScene)

  return (
    <>
      {currentScene === 'landing' && <LandingScene />}
      {currentScene === 'myroom' && <MyRoomScene />}
    </>
  )
}
