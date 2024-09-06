import type {TypeFromSelection} from 'groqd';
import type {
  FeaturedCollectionQuery,
  ProductCardFragment,
} from 'storefrontapi.generated';
import {Skeleton} from '../Skeleton';

import Autoplay from 'embla-carousel-autoplay';
import {useInView} from 'framer-motion';
import {useMemo, useRef, Suspense} from 'react';
import {Await, Link, useLoaderData} from '@remix-run/react';
import {flattenConnection} from '@shopify/hydrogen';
import type {loader as indexLoader} from '../../routes/_index';

import type {SectionDefaultProps} from '~/lib/type';
import type {
  CAROUSEL_SECTION_FRAGMENT,
  FEATURED_COLLECTION_SECTION_FRAGMENT,
} from '~/qroq/sections';

import {useDevice} from '~/hooks/useDevice';

import {SanityImage} from '../sanity/SanityImage';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPrevious,
} from '../ui/Carousel';
import {ProductCard} from '../product/ProductCard';
type FeaturedCollectionSectionProps = TypeFromSelection<
  typeof FEATURED_COLLECTION_SECTION_FRAGMENT
>;

type CarouselSectionProps = TypeFromSelection<typeof CAROUSEL_SECTION_FRAGMENT>;

export function CarouselSection(
  props: {data: CarouselSectionProps} & SectionDefaultProps,
) {
  const {data} = props;
  const {arrows, autoplay, loop, pagination, slides, title, collection} = data;

  const ref = useRef<HTMLDivElement>(null);
  const slidesPerViewDesktop = data.slidesPerViewDesktop || 3;
  const inView = useInView(ref);
  const plugins = useMemo(() => (autoplay ? [Autoplay()] : []), [autoplay]);
  const imageSizes = slidesPerViewDesktop
    ? `(min-width: 1024px) ${
        100 / slidesPerViewDesktop
      }vw, (min-width: 768px) 50vw, 100vw`
    : '(min-width: 768px) 50vw, 100vw';
  const device = useDevice();
  const isActive =
    device === 'mobile'
      ? slides?.length! > 1 || collection
      : slides?.length! > slidesPerViewDesktop || collection;

  return (
    <div className="container" ref={ref}>
      <h2>
        <a href={'/collections/' + collection?.store.slug?.current}>
          {title || collection?.store.title}
        </a>
      </h2>
      {((slides && slides?.length > 0) || collection) && (
        <Carousel
          className="mt-4 [--slide-spacing:1rem]"
          opts={{
            active: Boolean(isActive),
            loop: loop || false,
          }}
          plugins={plugins}
          style={
            {
              '--slides-per-view': slidesPerViewDesktop,
            } as React.CSSProperties
          }
        >
          <div className="relative">
            <CarouselContent>
              <AwaitFeaturedCollection
                error={
                  <Skeleton isError>
                    <CarouselItem className="[&>span]:h-full"></CarouselItem>
                  </Skeleton>
                }
                fallback={
                  <Skeleton>
                    <CarouselItem className="[&>span]:h-full"></CarouselItem>
                  </Skeleton>
                }
                sanityData={props.data}
              >
                {(products) =>
                  products.map((product) => (
                    <CarouselItem className="[&>span]:h-full" key={product.id}>
                      <ProductCard
                        product={product}
                        columns={{
                          desktop: slidesPerViewDesktop,
                          mobile: 1,
                        }}
                      />
                    </CarouselItem>
                  ))
                }
              </AwaitFeaturedCollection>

              {slides &&
                slides.length > 0 &&
                slides.map((slide) => (
                  <CarouselItem className="[&>span]:h-full" key={slide._key}>
                    <SanityImage
                      className="size-full object-cover"
                      data={slide.image}
                      loading={inView ? 'eager' : 'lazy'}
                      showBorder={false}
                      showShadow={false}
                      sizes={imageSizes}
                    />
                  </CarouselItem>
                ))}
            </CarouselContent>
            {arrows && isActive && (
              <div className="hidden md:block">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            )}
          </div>
          {pagination && isActive && <CarouselPagination />}
        </Carousel>
      )}
    </div>
  );
}
function AwaitFeaturedCollection(props: {
  children: (products: ProductCardFragment[]) => React.ReactNode;
  error: React.ReactNode;
  fallback: React.ReactNode;
  sanityData: CarouselSectionProps;
}) {
  const loaderData = useLoaderData<typeof indexLoader>();
  const featuredCollectionPromise = loaderData?.featuredCollectionPromise;
  let localPromise = featuredCollectionPromise.then();
  const sanityCollectionGid = props.sanityData?.collection?.store.gid;

  if (!localPromise) {
    console.warn(
      '[FeaturedCollectionSection] No featuredCollectionPromise found in loader data.',
    );
    return null;
  }
  return (
    <Suspense fallback={props.fallback}>
      <Await errorElement={props.error} resolve={localPromise}>
        {(data) => {
          // Resolve the collection data from Shopify with the gid from Sanity
          let collection:
            | NonNullable<FeaturedCollectionQuery['collection']>
            | null
            | undefined;

          for (const result of data) {
            if (result.status === 'fulfilled') {
              const {collection: resultCollection} = result.value;
              // Check if the gid from Sanity is the same as the gid from Shopify
              if (sanityCollectionGid === resultCollection?.id!) {
                collection = resultCollection;
                break;
              }
            } else if (result.status === 'rejected') {
              return props.error;
            }
          }

          const products =
            collection?.products?.nodes && collection?.products?.nodes?.length
              ? flattenConnection(collection?.products)
              : [];

          return <>{products && props.children(products)}</>;
        }}
      </Await>
    </Suspense>
  );
}
