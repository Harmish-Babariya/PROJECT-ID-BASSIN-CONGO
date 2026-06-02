"use client"
import { useLanguage } from "@/contexts/LanguageContext"
import { translateGeoName } from "@/lib/i18n/geo"

export type ProducteurFormState = {
  nom: string
  prenom: string
  sexe: string
  annee_naissance: string
  nationalite: string
  telephone: string
  pays_id: string
  zone_id: string
  village: string
  structure_embauche: string
  role_activite_cacao: string
  type_proprietaire: string
  communaute: string
  autres_activites: string[]
  autres_activites_details: string[]
  source_principale_revenus: string
  cultures_phares: string[]
  autres_cultures: string[]
  place_cacao: string
  main_oeuvre_supplementaire: string
  recolte_annee_derniere: string
  usage_cacao_recolte: string[]
  mode_vente: string[]
  kilos_vendus: string
  prix_kilo: string
  lieu_vente: string
  acheteur: string
  statut: string
}

export type PaysOption = { id: number; nom: string }
export type ZoneOption = { id: number; nom: string; pays_id: number }
export type VillageOption = { id: number; nom: string; zone_id: number }
export type NationaliteOption = { id: number; code: string; nom: string }

export const CULTURES_PHARES = ["Cacaoyer", "Manioc", "Safoutier", "Avocatier", "Banane plantain", "Palmier à huile"]
export const AUTRES_ACTIVITES = ["Artisanat", "Pêche", "Élevage", "Autre", "Aucune"]
export const ACHETEUR_OPTIONS = ["Camerounais", "CIB Olam", "Congolais", "Ouest Africain", "Diamant", "Non identifié"]

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[11px] sm:text-[13px] font-bold text-[#1A1A1A] tracking-[0.10em] sm:tracking-[0.12em] uppercase inline-block pb-2 border-b-2 border-[#2AC1A3] break-words">
        {number}. {title}
      </h2>
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] text-[#AAAAAA] tracking-[0.2em] uppercase font-medium mb-2 font-mono">
      {children}{required && " *"}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props
  return (
    <input
      {...rest}
      className={`w-full px-4 py-2.5 bg-[#f5f7fa] border border-transparent rounded-md text-[13px] text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:border-[#2AC1A3] focus:bg-white transition ${className}`}
    />
  )
}

function Select({ children, value, onChange }: {
  children: React.ReactNode
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2.5 bg-[#f5f7fa] border border-transparent rounded-md text-[13px] text-[#1A1A1A] focus:outline-none focus:border-[#2AC1A3] focus:bg-white transition appearance-none"
    >
      {children}
    </select>
  )
}

function FieldsetBox({ legend, children }: { legend?: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-gray-200 rounded-md px-4 pt-3 pb-3.5 relative">
      {legend && (
        <legend className="px-2 text-[9px] text-[#AAAAAA] tracking-[0.2em] uppercase font-mono">
          {legend}
        </legend>
      )}
      {children}
    </fieldset>
  )
}

function CheckboxGroupInline({ options, values, onChange, cols = 6, labels }: {
  options: string[]
  values: string[]
  onChange: (next: string[]) => void
  cols?: number
  labels?: Record<string, string>
}) {
  const gridCls =
    cols === 6 ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-6"
    : cols === 7 ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-7"
    : "grid-cols-2 sm:grid-cols-3"
  return (
    <div className={`grid ${gridCls} gap-x-4 gap-y-2`}>
      {options.map((opt) => {
        const checked = values.includes(opt)
        return (
          <label key={opt} className="flex items-center gap-2 text-[12px] text-[#1A1A1A] cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onChange(checked ? values.filter((v) => v !== opt) : [...values, opt])}
              className="w-3.5 h-3.5 appearance-none border border-gray-300 rounded-xs bg-white checked:bg-[#2AC1A3] checked:border-[#2AC1A3] relative cursor-pointer transition
                checked:after:content-[''] checked:after:absolute checked:after:top-px checked:after:left-1 checked:after:w-1 checked:after:h-2 checked:after:border-white checked:after:border-r-2 checked:after:border-b-2 checked:after:rotate-45"
            />
            <span>{labels?.[opt] ?? opt}</span>
          </label>
        )
      })}
    </div>
  )
}

function Divider() {
  return <div className="border-t border-gray-200 my-8" />
}

export default function ProducteurFormFields({
  form,
  setForm,
  pays,
  zones,
  villages,
  nationalites,
}: {
  form: ProducteurFormState
  setForm: React.Dispatch<React.SetStateAction<ProducteurFormState>>
  pays: PaysOption[]
  zones: ZoneOption[]
  villages: VillageOption[]
  nationalites: NationaliteOption[]
}) {
  const { t, locale } = useLanguage()
  const p = t.producteurs
  const co = t.common
  const geo = (n: string | null | undefined) => translateGeoName(n, locale)

  const update = <K extends keyof ProducteurFormState>(key: K, value: ProducteurFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const filteredZones = form.pays_id
    ? zones.filter((z) => String(z.pays_id) === form.pays_id)
    : zones

  const filteredVillages = form.zone_id
    ? villages.filter((v) => String(v.zone_id) === form.zone_id)
    : []

  // Preserve any pre-existing village name not present in the current referentiel
  // (typos, removed entries, or data from before the village table existed).
  const hasMatchingVillage = filteredVillages.some((v) => v.nom === form.village)
  const showLegacyOption = !!form.village && !hasMatchingVillage

  return (
    <div>
      {/* Section 1: Identification */}
      <section>
        <SectionHeader number="1" title={p.section1.replace(/^\d+\.\s*/, "")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <Label required>{p.labelNom}</Label>
            <Input
              value={form.nom}
              onChange={(e) => update("nom", e.target.value)}
              placeholder={p.placeholderNom}
            />
          </div>
          <div>
            <Label>{p.labelPrenom}</Label>
            <Input
              value={form.prenom}
              onChange={(e) => update("prenom", e.target.value)}
              placeholder={p.placeholderPrenom}
            />
          </div>
          <div>
            <Label required>{p.labelSexe}</Label>
            <Select value={form.sexe} onChange={(e) => update("sexe", e.target.value)}>
              <option value="">— {p.placeholderSelect} —</option>
              <option value="Homme">{co.male}</option>
              <option value="Femme">{co.female}</option>
            </Select>
          </div>
          <div>
            <Label>{p.labelAnnee}</Label>
            <Input
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={form.annee_naissance}
              onChange={(e) => update("annee_naissance", e.target.value)}
              placeholder={p.placeholderYear}
            />
          </div>
          <div>
            <Label>{p.labelNationalite}</Label>
            <Select
              value={form.nationalite}
              onChange={(e) => update("nationalite", e.target.value)}
            >
              <option value="">— {p.placeholderSelect} —</option>
              {form.nationalite && !nationalites.some((n) => n.nom === form.nationalite) && (
                <option value={form.nationalite}>{form.nationalite}</option>
              )}
              {nationalites.map((n) => (
                <option key={n.id} value={n.nom}>
                  {p.optionLabels[n.nom] ?? n.nom}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{p.labelCommunaute}</Label>
            <Input
              value={form.communaute}
              onChange={(e) => update("communaute", e.target.value)}
              placeholder={p.placeholderCommunaute}
              maxLength={50}
            />
          </div>
          <div>
            <Label>{p.labelTelephone}</Label>
            <Input
              type="tel"
              value={form.telephone}
              onChange={(e) => update("telephone", e.target.value)}
              placeholder={p.placeholderPhone}
            />
          </div>
          <div>
            <Label>{co.statutLabel}</Label>
            <Select value={form.statut} onChange={(e) => update("statut", e.target.value)}>
              <option value="Actif">{co.active}</option>
              <option value="Inactif">{co.inactive}</option>
            </Select>
          </div>
        </div>
      </section>

      <Divider />

      {/* Section 2: Localisation */}
      <section>
        <SectionHeader number="2" title={p.section2.replace(/^\d+\.\s*/, "")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <Label required>{p.labelPays}</Label>
            <Select
              value={form.pays_id}
              onChange={(e) => {
                update("pays_id", e.target.value)
                update("zone_id", "")
                update("village", "")
              }}
            >
              <option value="">— {p.placeholderSelect} —</option>
              {pays.map((py) => (
                <option key={py.id} value={String(py.id)}>{geo(py.nom)}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>{p.labelZone}</Label>
            <Select
              value={form.zone_id}
              onChange={(e) => {
                update("zone_id", e.target.value)
                update("village", "")
              }}
            >
              <option value="">— {p.placeholderSelect} —</option>
              {filteredZones.map((z) => (
                <option key={z.id} value={String(z.id)}>{geo(z.nom)}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label required>{p.labelVillage}</Label>
            <Select
              value={form.village}
              onChange={(e) => update("village", e.target.value)}
            >
              <option value="">
                {form.zone_id
                  ? `— ${p.placeholderSelect} —`
                  : co.selectZoneFirst}
              </option>
              {showLegacyOption && (
                <option value={form.village}>{form.village}</option>
              )}
              {filteredVillages.map((v) => (
                <option key={v.id} value={v.nom}>{v.nom}</option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <Divider />

      {/* Section 3: Structure et rôle */}
      <section>
        <SectionHeader number="3" title={p.section3.replace(/^\d+\.\s*/, "")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <Label>{p.labelRole}</Label>
            <Input
              value={form.role_activite_cacao}
              onChange={(e) => update("role_activite_cacao", e.target.value)}
              placeholder={p.placeholderRoleCacao}
            />
          </div>
          <div>
            <Label>{p.labelTypeProprietaire}</Label>
            <Input
              value={form.type_proprietaire}
              onChange={(e) => update("type_proprietaire", e.target.value)}
              placeholder={p.placeholderTypeProprietaire}
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* Section 4: Activités économiques */}
      <section>
        <SectionHeader number="4" title={p.section4.replace(/^\d+\.\s*/, "")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <Label>{p.labelSource}</Label>
            <Input
              value={form.source_principale_revenus}
              onChange={(e) => update("source_principale_revenus", e.target.value)}
              placeholder={p.placeholderSourceRevenus}
              maxLength={50}
            />
          </div>
          <div>
            <Label>{p.labelPlaceCacao}</Label>
            <Input
              value={form.place_cacao}
              onChange={(e) => update("place_cacao", e.target.value)}
              placeholder={p.placeholderPlaceCacao}
              maxLength={20}
            />
          </div>
          <div>
            <FieldsetBox legend={p.labelCulturesPhares}>
              <CheckboxGroupInline options={CULTURES_PHARES} values={form.cultures_phares} onChange={(next) => update("cultures_phares", next)} cols={3} labels={p.optionLabels} />
            </FieldsetBox>
          </div>
          <div>
            <FieldsetBox legend={p.labelAutresActivites}>
              <CheckboxGroupInline options={AUTRES_ACTIVITES} values={form.autres_activites} onChange={(next) => update("autres_activites", next)} cols={3} labels={p.optionLabels} />
            </FieldsetBox>
          </div>
        </div>
      </section>

      <Divider />

      {/* Section 5: Exploitation cacaoyère */}
      <section>
        <SectionHeader number="5" title={p.section5.replace(/^\d+\.\s*/, "")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <Label>{p.labelMainOeuvre}</Label>
            <Select value={form.main_oeuvre_supplementaire} onChange={(e) => update("main_oeuvre_supplementaire", e.target.value)}>
              <option value="">— {p.placeholderSelect} —</option>
              <option value="Oui">{co.yes}</option>
              <option value="Non">{co.no}</option>
            </Select>
          </div>
          <div>
            <Label>{p.labelRecolte}</Label>
            <Select value={form.recolte_annee_derniere} onChange={(e) => update("recolte_annee_derniere", e.target.value)}>
              <option value="">— {p.placeholderSelect} —</option>
              <option value="Oui">{co.yes}</option>
              <option value="Non">{co.no}</option>
            </Select>
          </div>
          <div>
            <Label>{p.labelUsageCacao}</Label>
            <Input
              value={form.usage_cacao_recolte[0] ?? ""}
              onChange={(e) => update("usage_cacao_recolte", e.target.value ? [e.target.value] : [])}
              placeholder={p.placeholderUsageCacao}
            />
          </div>
          <div>
            <Label>{p.labelModeVente}</Label>
            <Input
              value={form.mode_vente[0] ?? ""}
              onChange={(e) => update("mode_vente", e.target.value ? [e.target.value] : [])}
              placeholder={p.placeholderModeVente}
            />
          </div>
          <div>
            <Label>{p.labelKilos}</Label>
            <Input
              type="number"
              min={0}
              value={form.kilos_vendus}
              onChange={(e) => update("kilos_vendus", e.target.value)}
              placeholder={p.placeholderAmount}
            />
          </div>
          <div>
            <Label>{p.labelPrixKilo}</Label>
            <Input
              type="number"
              min={0}
              value={form.prix_kilo}
              onChange={(e) => update("prix_kilo", e.target.value)}
              placeholder={p.placeholderAmount}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>{p.labelLieuVente}</Label>
            <Input
              value={form.lieu_vente}
              onChange={(e) => update("lieu_vente", e.target.value)}
              placeholder={p.placeholderLieuVente}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>{p.labelAcheteur}</Label>
            <Input
              value={form.acheteur}
              onChange={(e) => update("acheteur", e.target.value)}
              placeholder={p.placeholderAcheteur}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
