import { setGlobalOptions } from 'firebase-functions/v2'
import { generatePlan } from './generatePlan.js'
import { detectEquipment } from './detectEquipment.js'
import { resolveVideo } from './resolveVideo.js'

setGlobalOptions({ region: 'asia-south1', maxInstances: 10 })

export { generatePlan, detectEquipment, resolveVideo }
