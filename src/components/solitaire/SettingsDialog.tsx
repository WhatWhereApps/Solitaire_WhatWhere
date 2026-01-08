import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Vibrate, Globe, Hand } from 'lucide-react';
import { 
  GameSettings, 
  CardBackDesign, 
  VibrationIntensity,
  HandPreference,
  cardBackDesigns 
} from '@/hooks/useGameSettings';
import { cn } from '@/lib/utils';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '@/i18n';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: GameSettings;
  onUpdateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
}

const vibrationValues: VibrationIntensity[] = ['off', 'light', 'medium', 'heavy'];

export const SettingsDialog = ({ 
  open, 
  onOpenChange, 
  settings, 
  onUpdateSetting 
}: SettingsDialogProps) => {
  const { t, language, setLanguage } = useLanguage();
  const vibrationIndex = vibrationValues.indexOf(settings.vibrationIntensity);

  const vibrationLabels: Record<VibrationIntensity, string> = {
    off: t.vibrationOff,
    light: t.vibrationLight,
    medium: t.vibrationMedium,
    heavy: t.vibrationHeavy,
  };

  const cardBackNames: Record<CardBackDesign, string> = {
    'classic-blue': t.classicBlue,
    'classic-red': t.classicRed,
    'royal-purple': t.royalPurple,
    'forest-green': t.forestGreen,
    'midnight': t.midnight,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-emerald-900 border-emerald-700 text-white max-w-sm max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl text-emerald-100">{t.settings}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-2">
          <div className="space-y-6 py-4">
            {/* Language Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-emerald-300" />
                <Label className="text-base text-emerald-100">{t.language}</Label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as LanguageCode)}
                    className={cn(
                      "p-2 rounded-lg text-xs transition-all duration-200 border",
                      language === lang.code
                        ? "bg-emerald-500 border-emerald-400 text-white"
                        : "bg-emerald-800/50 border-emerald-700/50 text-emerald-200 hover:bg-emerald-700/50"
                    )}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="block mt-1 truncate">{lang.nativeName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-emerald-300" />
                ) : (
                  <VolumeX className="h-5 w-5 text-emerald-400/50" />
                )}
                <Label htmlFor="sound" className="text-base text-emerald-100">
                  {t.soundEffects}
                </Label>
              </div>
              <Switch
                id="sound"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => onUpdateSetting('soundEnabled', checked)}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            {/* Vibration Intensity */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Vibrate className="h-5 w-5 text-emerald-300" />
                <Label className="text-base text-emerald-100">
                  {t.vibration}: {vibrationLabels[settings.vibrationIntensity]}
                </Label>
              </div>
              <Slider
                value={[vibrationIndex]}
                onValueChange={([value]) => onUpdateSetting('vibrationIntensity', vibrationValues[value])}
                max={3}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-emerald-400/70">
                <span>{t.vibrationOff}</span>
                <span>{t.vibrationLight}</span>
                <span>{t.vibrationMedium}</span>
                <span>{t.vibrationHeavy}</span>
              </div>
            </div>

            {/* Hand Preference */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Hand className="h-5 w-5 text-emerald-300" />
                <Label className="text-base text-emerald-100">{t.handPreference}</Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateSetting('handPreference', 'left')}
                  className={cn(
                    "p-3 rounded-lg text-sm transition-all duration-200 border",
                    settings.handPreference === 'left'
                      ? "bg-emerald-500 border-emerald-400 text-white"
                      : "bg-emerald-800/50 border-emerald-700/50 text-emerald-200 hover:bg-emerald-700/50"
                  )}
                >
                  {t.leftHand}
                </button>
                <button
                  onClick={() => onUpdateSetting('handPreference', 'right')}
                  className={cn(
                    "p-3 rounded-lg text-sm transition-all duration-200 border",
                    settings.handPreference === 'right'
                      ? "bg-emerald-500 border-emerald-400 text-white"
                      : "bg-emerald-800/50 border-emerald-700/50 text-emerald-200 hover:bg-emerald-700/50"
                  )}
                >
                  {t.rightHand}
                </button>
              </div>
              <p className="text-xs text-emerald-400/70 text-center">
                {t.handPreferenceDescription}
              </p>
            </div>

            {/* Card Back Design */}
            <div className="space-y-3">
              <Label className="text-base text-emerald-100">{t.cardBackDesign}</Label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.entries(cardBackDesigns) as [CardBackDesign, typeof cardBackDesigns[CardBackDesign]][]).map(
                  ([key, design]) => (
                    <button
                      key={key}
                      onClick={() => onUpdateSetting('cardBackDesign', key)}
                      className={cn(
                        "w-full aspect-[2/3] rounded-lg transition-all duration-200",
                        "border-2",
                        settings.cardBackDesign === key
                          ? "ring-2 ring-emerald-400 border-emerald-400 scale-105"
                          : "border-white/20 hover:scale-105"
                      )}
                      style={{
                        background: `linear-gradient(to bottom right, hsl(var(--${design.cssVar})), hsl(var(--${design.cssVar}-light)))`,
                      }}
                    >
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-white/50 text-xs">♠</span>
                      </div>
                    </button>
                  )
                )}
              </div>
              <p className="text-xs text-emerald-400/70 text-center">
                {cardBackNames[settings.cardBackDesign]}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
